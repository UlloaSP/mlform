import { describe, expect, it } from "vite-plus/test";
import { createBuiltinMlRegistry } from "@/builtins";
import { createForm, executeMultiBackendPipeline } from "@/runtime";
import { normalizeSchema, validateSchema } from "@/schema";
import { createFormView } from "@/view";

describe("explicit identity and configuration contracts", () => {
  it("preserves explicit field/report ids through values, conditions, layouts and submissions", async () => {
    const view = createFormView({
      schema: {
        fields: [
          { id: "customer_age", kind: "number", label: "Age", mappedTo: "model_age" },
          {
            id: "Extra",
            kind: "text",
            label: "Extra",
            hiddenWhen: { kind: "field-value", field: "customer_age", equals: 0 },
          },
        ],
        reports: [{ id: "Model_Result", kind: "regressor", mappedTo: "prediction" }],
      },
      initialValues: { customer_age: 0 },
      layout: {
        kind: "stacked",
        children: [
          { kind: "field", field: "customer_age" },
          { kind: "field", field: "Extra" },
          { kind: "report", report: "Model_Result" },
        ],
      },
      transport: {
        submit: async () => ({
          reports: [
            { backend: "default", mappedTo: "prediction", status: "ready", payload: { value: 7 } },
          ],
        }),
      },
    });
    try {
      expect(view.form.getField("customer_age")?.state.value).toBe(0);
      expect(view.form.getField("Extra")?.state.visible).toBe(false);
      expect(view.form.getReport("Model_Result")?.id).toBe("Model_Result");
      expect((await view.submit()).modelValues).toEqual({ model_age: 0 });
    } finally {
      view.dispose();
    }
  });

  it("only generates slugs for implicit ids and avoids explicit ids regardless of order", () => {
    const registry = createBuiltinMlRegistry();
    const schema = normalizeSchema(
      {
        fields: [
          { kind: "text", label: "Customer age" },
          { kind: "text", id: "customer-age", label: "Explicit" },
          { kind: "text", id: "customer_age", label: "Distinct" },
        ],
      },
      registry,
    );
    expect(schema.fields.map(({ id }) => id)).toEqual([
      "customer-age-2",
      "customer-age",
      "customer_age",
    ]);
    for (const id of ["", " ", "has space", "__proto__", "constructor", "prototype"]) {
      expect(() =>
        normalizeSchema({ fields: [{ kind: "text", id, label: "Invalid" }] }, registry),
      ).toThrow();
      expect(() =>
        normalizeSchema({ fields: [], reports: [{ kind: "regressor", id }] }, registry),
      ).toThrow();
    }
    expect(() =>
      normalizeSchema(
        {
          fields: [
            { kind: "text", id: "same_id", label: "First" },
            { kind: "text", id: "same_id", label: "Second" },
          ],
        },
        registry,
      ),
    ).toThrow(/Duplicate explicit id/);
  });

  it.each([
    { kind: "long-text", minLength: 4, maxLength: 2, path: "minLength" },
    { kind: "rating", min: 5, max: 2, path: "min" },
  ])("rejects contradictory $kind ranges before values exist", ({ path, ...field }) => {
    const registry = createBuiltinMlRegistry();
    const schema = { fields: [{ label: "Invalid", ...field }] };
    expect(() => normalizeSchema(schema, registry)).toThrow(/Minimum/);
    expect(validateSchema(schema, registry)).toMatchObject({
      success: false,
      issues: [{ path: ["fields", 0, path], code: "invalid-config" }],
    });
  });

  it("generates valid ids even when a label is a reserved object key", () => {
    const registry = createBuiltinMlRegistry();
    const normalized = normalizeSchema(
      {
        fields: [{ kind: "text", label: "Constructor" }],
        reports: [{ kind: "regressor", label: "Prototype" }],
      },
      registry,
    );
    expect(normalizeSchema(normalized, registry)).toEqual(normalized);
    expect(normalized.fields[0].id).toBe("constructor-2");
    expect(normalized.reports[0].id).toBe("prototype-2");
  });

  it("distinguishes a skipped report fetch from a ready submitted report", async () => {
    const form = createForm({
      registry: createBuiltinMlRegistry(),
      schema: {
        fields: [],
        reports: [{ id: "prediction", kind: "regressor", mappedTo: "prediction" }],
      },
      transport: {
        submit: async () => ({
          reports: [
            { backend: "model", mappedTo: "prediction", status: "ready", payload: { value: 7 } },
          ],
        }),
      },
    });
    try {
      const { runs } = await executeMultiBackendPipeline({ form, backends: ["model"] });
      expect(form.getReport("prediction")?.state.status).toBe("ready");
      expect(runs.model).toHaveProperty("skippedReportFetchIds", ["prediction"]);
      expect(runs.model).not.toHaveProperty("skippedReportIds");
    } finally {
      form.dispose();
    }
  });
});
