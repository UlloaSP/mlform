// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { describe, expect, it } from "vite-plus/test";
import { createBuiltinMlRegistry } from "mlform/builtins";
import { createForm } from "mlform/runtime";

describe("numeric step validation", () => {
  it.each([
    { value: 10, step: 1e-8, valid: true },
    { value: 120, step: 1e-8, valid: true },
    { value: -10, step: 1e-8, valid: true },
    { value: 0.8, step: 1e-8, valid: true },
    { value: 1.2, step: 1e-8, valid: true },
    { value: 10.000000005, step: 1e-8, valid: false },
    { value: -10.000000005, step: 1e-8, valid: false },
    { value: 0.800000005, step: 1e-8, valid: false },
    { value: 0.3, step: 0.1, min: 0.1, valid: true },
    { value: 0.35, step: 0.1, min: 0.1, valid: false },
    { value: 1, step: 2, min: -3, valid: true },
    { value: 2, step: 2, min: -3, valid: false },
    { value: 1e15, step: 1, valid: true },
    { value: 1e15 + 0.125, step: 1, valid: false },
    { value: 1e15 + 0.25, step: 1, valid: false },
    { value: 1e15 + 0.5, step: 1, valid: false },
    { value: -1e15 - 0.5, step: 1, valid: false },
    { value: 1e15 + 0.5, step: 1, min: 1e15, valid: false },
    { value: 1e12 + 0.0005, step: 0.001, valid: false },
    { value: 1e12 + 0.001, step: 0.001, valid: true },
    { value: 1, step: Number.MIN_VALUE, valid: true },
    { value: Number.MAX_VALUE, step: 0.5, valid: true },
    { value: Number.MAX_VALUE, step: Number.MAX_VALUE, min: -Number.MAX_VALUE, valid: true },
  ])("validates $value with step $step (valid: $valid)", async ({ value, step, min, valid }) => {
    // Series sub-fields and standalone fields use the same numeric definition.
    for (const series of [false, true]) {
      const number = { kind: "number", label: "Value", step, min };
      const field = series
        ? {
            kind: "series",
            label: "Measurements",
            columns: [
              { id: "field1", ...number },
              { id: "field2", kind: "text", label: "Note" },
            ],
          }
        : number;
      const form = createForm({
        registry: createBuiltinMlRegistry(),
        schema: { fields: [{ ...field, id: "input", mappedTo: "input" }] },
        transport: { submit: async () => ({ reports: [] }) },
      });
      form.setValues({ input: series ? [{ field1: value, field2: "" }] : value });
      expect((await form.validate()).valid).toBe(valid);
      form.dispose();
    }
  });
});
