import { describe, expect, it } from "vite-plus/test";
import { createForm } from "mlform/runtime";
import { createBuiltinMlRegistry } from "mlform/builtins";

describe("numeric input contract", () => {
  it.each([
    "1e309",
    "Infinity",
    "-Infinity",
    Infinity,
    -Infinity,
    NaN,
    "0x10",
    "0b10",
    "9007199254740993",
    "1e-999",
    "true",
    {},
    true,
  ])("rejects invalid or unrepresentable %s in optional fields", async (value) => {
    const form = createForm({
      schema: {
        fields: [
          { id: "number", kind: "number", label: "Number" },
          {
            id: "series",
            kind: "series",
            label: "Series",
            columns: [{ id: "value", kind: "number", label: "Value" }],
          },
        ],
      },
      registry: createBuiltinMlRegistry(),
      transport: { submit: async () => ({ reports: [] }) },
    });
    form.setValues({ number: value, series: [{ value }] });
    await form.validate();
    expect(form.getField("number")?.state.valid).toBe(false);
    expect(form.getField("series")?.state.valid).toBe(false);
    form.dispose();
  });

  it.each([
    ["1,5", 1.5],
    ["-0.005", -0.005],
    ["1e-8", 1e-8],
    ["1.2500", 1.25],
    ["", null],
    ["  ", null],
    ["1e100", 1e100],
  ])("normalizes %s", async (value, expected) => {
    const form = createForm({
      schema: { fields: [{ id: "n", kind: "number", label: "N" }] },
      registry: createBuiltinMlRegistry(),
      transport: { submit: async () => ({ reports: [] }) },
    });
    form.getField("n")!.setValue(value);
    await form.validate();
    expect(form.getField("n")?.state.value).toBe(expected);
    expect(form.getField("n")?.state.valid).toBe(true);
    form.dispose();
  });
});
