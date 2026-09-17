import { describe, expect, it } from "vitest";
import { createBuiltinMlRegistry } from "@/builtins";
import { normalizeSchema, validateSchema } from "@/schema";

describe("normalized schema contracts", () => {
  it("normalizes and validates declarative condition field references", () => {
    const normalized = normalizeSchema(
      {
        fields: [
          { id: "Advanced Mode", kind: "boolean", label: "Advanced" },
          {
            id: "details",
            kind: "text",
            label: "Details",
            hiddenWhen: { kind: "field-value", field: "Advanced Mode", falsy: true },
          },
        ],
      },
      createBuiltinMlRegistry(),
    );

    expect(normalized.fields[1]?.hiddenWhen).toMatchObject({ field: "advanced-mode" });
    expect(() =>
      normalizeSchema(
        {
          fields: [
            {
              kind: "text",
              label: "Details",
              hiddenWhen: { kind: "field-value", field: "missing", truthy: true },
            },
          ],
        },
        createBuiltinMlRegistry(),
      ),
    ).toThrow('references unknown field "missing"');
  });

  it("reports the precise path for invalid condition references", () => {
    expect(
      validateSchema(
        {
          fields: [
            {
              kind: "text",
              label: "Details",
              hiddenWhen: { kind: "field-value", field: "missing", truthy: true },
            },
          ],
        },
        createBuiltinMlRegistry(),
      ),
    ).toMatchObject({
      success: false,
      issues: [{ path: ["fields", 0, "hiddenWhen", "field"], code: "invalid-config" }],
    });
  });

  it("rejects duplicate display keys during normalization", () => {
    expect(() =>
      normalizeSchema(
        {
          fields: [
            { kind: "text", label: "First", displayKey: " review " },
            { kind: "text", label: "Second", displayKey: "review" },
          ],
        },
        createBuiltinMlRegistry(),
      ),
    ).toThrow('duplicate displayKey "review"');
  });

  it("rejects overlapping mapped targets and nested value paths", () => {
    expect(() =>
      normalizeSchema(
        {
          fields: [
            { kind: "number", label: "Age", mappedTo: "patient.age" },
            { kind: "text", label: "Age copy", valuePath: ["patient", "age"] },
          ],
        },
        createBuiltinMlRegistry(),
      ),
    ).toThrow(/submission path "patient\.age".*fields "age" and "age-copy"/);

    expect(() =>
      normalizeSchema(
        {
          fields: [
            { kind: "text", label: "Patient", mappedTo: "patient" },
            { kind: "number", label: "Age", mappedTo: "patient.age" },
          ],
        },
        createBuiltinMlRegistry(),
      ),
    ).toThrow(/overlaps submission path/);
  });

  it("rejects duplicate targets produced by custom field definitions", () => {
    expect(() =>
      normalizeSchema(
        {
          fields: [
            {
              kind: "onehot-category",
              label: "Color",
              options: [
                { label: "Red", value: "red", mappedTo: "is_color" },
                { label: "Green", value: "green", mappedTo: "is_color" },
              ],
            },
          ],
        },
        createBuiltinMlRegistry(),
      ),
    ).toThrow(/duplicate submission path "is_color"/i);
  });

  it("rejects series sub-field kinds that the series strategy cannot execute", () => {
    const registry = createBuiltinMlRegistry().registerField({
      kind: "custom-cell",
      schema: {
        parse: (value: unknown) => value,
      } as never,
    });

    expect(() =>
      normalizeSchema(
        {
          fields: [
            {
              kind: "series",
              label: "Unsupported series",
              field1: { kind: "custom-cell", label: "Custom" },
              field2: { kind: "number", label: "Value" },
            },
          ],
        },
        registry,
      ),
    ).toThrow(/does not support sub-field kind "custom-cell"/i);
  });
});
