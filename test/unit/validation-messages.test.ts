import { describe, expect, it } from "vite-plus/test";
import { createForm } from "@/runtime";
import { createBuiltinMlRegistry } from "@/builtins";
import { createFormView } from "@/view";
import { z } from "zod";

const schema = {
  fields: [
    { id: "age", kind: "number", label: "Age", min: 18, required: true },
    {
      id: "readings",
      kind: "series",
      label: "Readings",
      minPoints: 2,
      columns: [{ id: "value", kind: "number", label: "Value", min: 1, required: true }],
    },
  ],
};
const formatValidationMessage = ({ code, args }: { code: string; args: readonly unknown[] }) => {
  if (code === "required") return "Obligatorio.";
  if (code === "minValue") return `Mínimo: ${String(args[0])}.`;
  if (code === "minPoints") return `Faltan mediciones (mínimo ${String(args[0])}).`;
  if (code === "seriesRow")
    return `Fila ${String(args[0])} (${String(args[1])}): ${String(args[2])}`;
  return undefined;
};
const options = {
  schema,
  transport: { submit: async () => ({ reports: [] }) },
  formatValidationMessage,
};

describe("validation message formatting", () => {
  it.each([
    { kind: "number", min: 2, defaultValue: 1, code: "minValue" },
    { kind: "text", minLength: 2, defaultValue: "a", code: "minLength" },
    { kind: "long-text", maxLength: 2, defaultValue: "long", code: "maxLength" },
    { kind: "rating", max: 5, defaultValue: 6, code: "maxValue" },
    { kind: "category", options: ["a"], defaultValue: "b", code: "categoryOptionMismatch" },
    { kind: "single-choice", options: ["a"], defaultValue: "b", code: "categoryOptionMismatch" },
    { kind: "multi-choice", options: ["a"], defaultValue: ["b"], code: "categoryOptionMismatch" },
    {
      kind: "onehot-category",
      options: [{ label: "A", value: "a", mappedTo: "a" }],
      defaultValue: "b",
      code: "categoryOptionMismatch",
    },
    {
      kind: "mapped-category",
      options: [{ label: "A", value: "a", mapping: {} }],
      defaultValue: "b",
      code: "categoryOptionMismatch",
    },
    { kind: "date", min: "2026-01-01", defaultValue: "2025-01-01", code: "dateOnOrAfter" },
  ])("formats $kind errors with a stable code and the current field", ({ code, ...field }) => {
    const form = createForm({
      registry: createBuiltinMlRegistry(),
      schema: { fields: [{ id: "input", label: "Input", ...field }] },
      transport: options.transport,
      formatValidationMessage: (message) => `${message.field.id}: ${message.code}`,
    });
    expect(form.getField("input")!.state.errors).toEqual([`input: ${code}`]);
    form.dispose();
  });

  it("exposes the same formatter to synchronous and asynchronous custom validators", async () => {
    const form = createForm({
      registry: createBuiltinMlRegistry().registerField({
        kind: "custom",
        schema: z.object({ kind: z.literal("custom"), label: z.string() }),
        getDefaultValue: () => "sync",
        validateSync: (value, _, context) =>
          value === "sync" ? [context.formatMessage!("custom.sync", "Sync error")] : [],
        validate: async (_, __, context) => [context.formatMessage!("custom.async", "Async error")],
      }),
      schema: { fields: [{ id: "input", kind: "custom", label: "Input" }] },
      transport: options.transport,
      formatValidationMessage: (message) => `Translated ${message.code}`,
    });
    const field = form.getField("input")!;
    expect(field.state.errors).toEqual(["Translated custom.sync"]);
    field.setValue("async");
    expect((await field.validate()).errors).toEqual(["Translated custom.async"]);
    form.dispose();
  });
  it("uses per-form messages for initial, edited, restored and validated values", async () => {
    const form = createForm({ ...options, registry: createBuiltinMlRegistry() });
    const age = form.getField("age")!;
    expect(age.state.errors).toEqual(["Obligatorio."]);
    age.setValue(4);
    expect(age.state.errors).toEqual(["Mínimo: 18."]);
    const snapshot = form.createSnapshot();
    age.setValue(20);
    form.restoreSnapshot(snapshot);
    expect(age.state.errors).toEqual(["Mínimo: 18."]);
    expect((await form.validate()).fields.age).toEqual(["Mínimo: 18."]);
    form.reset();
    expect(age.state.errors).toEqual(["Obligatorio."]);
    const other = createForm({
      schema,
      registry: createBuiltinMlRegistry(),
      transport: options.transport,
    });
    expect(other.getField("age")!.state.errors).toEqual(["This field is required."]);
    other.dispose();
    form.dispose();
  });

  it("uses the same messages in series validation and rendered cell descriptors", () => {
    const view = createFormView({ ...options, initialValues: { readings: [{ value: 0 }] } });
    expect(view.getField("readings")!.state.errors).toEqual([
      "Faltan mediciones (mínimo 2).",
      "Fila 1 (Value): Mínimo: 1.",
    ]);
    expect(view.getField("readings")!.descriptor.props?.cellErrors).toEqual([
      { value: ["Mínimo: 1."] },
    ]);
    view.dispose();
  });
});
