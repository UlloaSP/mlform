import { describe, expect, it, vi } from "vite-plus/test";
import * as z from "zod";
import { attachDesignSystem } from "@/design";
import { createForm } from "@/runtime";
import { validateSchema } from "@/schema";
import { createBuiltinTestKit } from "../helpers/builtin-test-kit";

const registry = () => createBuiltinTestKit().registry;
const transport = { submit: vi.fn(async () => ({})) };

describe("schema and runtime boundaries", () => {
  it("rejects prototype paths before creating a form", () => {
    const schema = { fields: [{ kind: "text", label: "Value", mappedTo: "__proto__.polluted" }] };
    expect(validateSchema(schema, registry())).toMatchObject({
      success: false,
      issues: [{ path: ["fields", 0, "mappedTo"], code: "invalid-config" }],
    });
    expect(() =>
      createForm({
        registry: registry(),
        transport,
        schema,
      }),
    ).toThrow(/unsafe submission path segment/i);
    expect(Object.hasOwn(Object.prototype, "polluted")).toBe(false);
    expect(
      validateSchema(
        { fields: [{ kind: "text", label: "Value", valuePath: ["constructor", "payload"] }] },
        registry(),
      ),
    ).toMatchObject({
      success: false,
      issues: [{ path: ["fields", 0, "valuePath"], code: "invalid-config" }],
    });
  });

  it("settles an aborted submission while a validator is still pending", async () => {
    const entered = Promise.withResolvers<void>();
    const validation = Promise.withResolvers<void>();
    const form = createForm({
      registry: registry(),
      transport,
      schema: { fields: [] },
      validators: [
        async () => {
          entered.resolve();
          await validation.promise;
        },
      ],
    });

    const pending = form.submit();
    await entered.promise;
    form.abortSubmit("cancelled");
    await expect(pending).rejects.toThrow(/cancelled/);
    expect(form.state).toMatchObject({ operation: "idle", submissionStatus: "aborted" });
    validation.resolve();
    await validation.promise;
    expect(form.state.operation).toBe("idle");
  });

  it("settles external cancellation during validation", async () => {
    const entered = Promise.withResolvers<void>();
    const validation = Promise.withResolvers<void>();
    const controller = new AbortController();
    const form = createForm({
      registry: registry(),
      transport,
      schema: { fields: [] },
      validators: [
        async () => {
          entered.resolve();
          await validation.promise;
        },
      ],
    });

    const pending = form.submit({ signal: controller.signal });
    await entered.promise;
    controller.abort("external");
    await expect(pending).rejects.toThrow(/external/);
    expect(form.state.operation).toBe("idle");
    validation.resolve();
  });

  it("aborts after validation finishes but before transport starts", async () => {
    const submit = vi.fn(async () => ({}));
    const form = createForm({
      registry: registry(),
      transport: { submit },
      schema: { fields: [] },
    });
    form.subscribeTransitions((transition) => {
      if (transition.type === "validation-finished") form.abortSubmit("after-validation");
    });

    await expect(form.submit()).rejects.toThrow(/after-validation/);
    expect(form.state).toMatchObject({ operation: "idle", submissionStatus: "aborted" });
    expect(submit).not.toHaveBeenCalled();
  });

  it("settles a pending submission when the form is disposed", async () => {
    const entered = Promise.withResolvers<void>();
    const validation = Promise.withResolvers<void>();
    const form = createForm({
      registry: registry(),
      transport,
      schema: { fields: [] },
      validators: [
        async () => {
          entered.resolve();
          await validation.promise;
        },
      ],
    });

    const pending = form.submit();
    await entered.promise;
    form.dispose();
    await expect(pending).rejects.toThrow(/aborted/);
    expect(form.state.lifecycle).toBe("disposed");
    validation.resolve();
  });

  it("turns a report transport factory failure into a terminal error state", async () => {
    const custom = registry();
    custom.registerReport({
      kind: "broken-fetch",
      schema: z.object({ kind: z.literal("broken-fetch") }),
      fetch: () => {
        throw new Error("factory failed");
      },
    });
    const form = createForm({
      registry: custom,
      transport,
      schema: { fields: [], reports: [{ kind: "broken-fetch", id: "report" }] },
    });
    const report = form.getReport("report")!;

    await report.fetch({
      reportId: "report",
      inputs: [],
      displayValues: {},
      modelValues: {},
      reports: [],
      reportContexts: {},
      meta: {},
      raw: null,
    });
    expect(report.state).toMatchObject({ status: "error", error: "factory failed" });
  });

  it("rejects missing mapped-category targets during schema validation", () => {
    const result = validateSchema(
      {
        fields: [
          {
            kind: "mapped-category",
            label: "Preset",
            options: [{ label: "A", value: "a", mapping: { absent: 1 } }],
          },
        ],
      },
      registry(),
    );
    expect(result).toMatchObject({
      success: false,
      issues: [{ path: ["fields", 0, "options", 0, "mapping", "absent"] }],
    });
  });

  it("validates field references declared by custom definitions", () => {
    const custom = registry();
    custom.registerField({
      kind: "linked",
      schema: z.object({ kind: z.literal("linked"), label: z.string(), target: z.string() }),
      getFieldReferences: (config) => [{ id: config.target, path: ["target"] }],
    });
    expect(
      validateSchema({ fields: [{ kind: "linked", label: "Link", target: "absent" }] }, custom),
    ).toMatchObject({ success: false, issues: [{ path: ["fields", 0, "target"] }] });
  });

  it("rejects invalid date limits and unknown top-level schema properties consistently", () => {
    const pack = registry();
    expect(
      validateSchema({ fields: [{ kind: "date", label: "Day", min: "nonsense" }] }, pack),
    ).toMatchObject({ success: false, issues: [{ path: ["fields", 0, "min"] }] });
    const schema = { fields: [], fieldz: [] };
    expect(validateSchema(schema, pack)).toMatchObject({
      success: false,
      issues: [{ path: ["fieldz"] }],
    });
    expect(() => createForm({ registry: pack, transport, schema })).toThrow(
      /Unsupported schema property "fieldz"/,
    );
  });
});

describe("design boundaries", () => {
  it("retains the previous configuration after a strict update fails", () => {
    const host = document.createElement("div");
    const design = attachDesignSystem(host, { config: { strict: true } });
    expect(() => design.update({ theme: "missing-theme" })).toThrow(/Unknown theme/);
    expect(design.config.theme).toBeUndefined();
    expect(design.resolved?.themeId).toBe("neutral");
    design.disconnect();
  });

  it("creates change events in the host document", () => {
    const iframe = document.createElement("iframe");
    document.body.append(iframe);
    const foreignDocument = iframe.contentDocument!;
    const host = foreignDocument.createElement("div");
    foreignDocument.body.append(host);
    let nativeEvent = false;
    host.addEventListener("ml-design-system-change", (event) => {
      nativeEvent = event instanceof foreignDocument.defaultView!.CustomEvent;
    });
    const design = attachDesignSystem(host);
    expect(nativeEvent).toBe(true);
    design.disconnect();
    iframe.remove();
  });
});
