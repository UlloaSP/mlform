// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { describe, expect, it } from "vite-plus/test";
import {
  booleanFieldDefinition,
  createBuiltinMlRegistry,
  numberFieldDefinition,
  seriesFieldDefinition,
  textFieldDefinition,
} from "@/builtins";
import { createBuiltinTestKit } from "../helpers/builtin-test-kit";

describe("builtin definitions", () => {
  it("creates a complete headless registry", () => {
    const registry = createBuiltinMlRegistry();

    expect(registry.getField("text")).toBe(textFieldDefinition);
    expect(registry.getReport("classifier")?.kind).toBe("classifier");
  });
  it("keeps number field normalization behavior", () => {
    expect(numberFieldDefinition.normalizeValue?.("42", { kind: "number", label: "Age" })).toBe(42);
    expect(numberFieldDefinition.normalizeValue?.("", { kind: "number", label: "Age" })).toBeNull();
  });

  it("keeps definitions headless and presentation in the kit", () => {
    expect("describe" in booleanFieldDefinition).toBe(false);
    const presenter = createBuiltinTestKit().descriptorRegistry.getField("boolean");
    const descriptor = presenter?.describe(
      {
        kind: "boolean",
        id: "enabled",
        label: "Enabled",
        trueLabel: "On",
        falseLabel: "Off",
      },
      {
        fieldId: "enabled",
        value: true,
        state: { value: true, errors: [], status: "valid" },
      },
    );

    expect(descriptor?.props.trueLabel).toBe("On");
    expect(descriptor?.props.falseLabel).toBe("Off");
  });

  it("normalizes and serializes series values", () => {
    const config = seriesFieldDefinition.schema.parse({
      kind: "series",
      label: "History",
      field1: { kind: "date", label: "field1", required: true },
      field2: { kind: "number", label: "field2", required: true },
      granularity: "date",
    });

    const normalized = seriesFieldDefinition.normalizeValue?.(
      [{ field1: "2026-01-01", field2: "10" }, ["2026-01-02", 12], { nope: "invalid" }],
      config,
    );

    expect(normalized).toHaveLength(2);
    expect(normalized?.[0]?.field2).toBe(10);
    expect(normalized?.[1]?.field1).toBeInstanceOf(Date);
    expect(seriesFieldDefinition.serializeValue?.(normalized ?? [], config)).toEqual([
      { field1: "2026-01-01", field2: 10 },
      { field1: "2026-01-02", field2: 12 },
    ]);
  });

  it("validates series sub-fields", () => {
    const config = seriesFieldDefinition.schema.parse({
      kind: "series",
      label: "History",
      field1: { kind: "date", label: "field1", required: true },
      field2: { kind: "number", label: "field2", required: true, min: 10 },
    });

    const errors = seriesFieldDefinition.validateSync?.(
      [
        { field1: null, field2: 5 },
        { field1: new Date("2026-01-01"), field2: 12 },
      ],
      config,
      {
        field: { ...config, id: "history" },
        values: {},
        submitCount: 0,
        validationVersion: 1,
      },
    );

    expect(errors).toContain("Row 1 (field1): This field is required.");
    expect(errors).toContain("Row 1 (field2): Minimum value is 10.");
  });
});
