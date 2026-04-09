// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { describe, expect, it } from "vite-plus/test";
import { numberFieldDefinition, timeSeriesFieldDefinition } from "@/engine";

describe("builtin definitions", () => {
  it("keeps number field normalization behavior", () => {
    expect(numberFieldDefinition.normalizeValue?.("42", { kind: "number", label: "Age" })).toBe(42);
    expect(numberFieldDefinition.normalizeValue?.("", { kind: "number", label: "Age" })).toBeNull();
  });

  it("normalizes and serializes time-series values", () => {
    const config = timeSeriesFieldDefinition.schema.parse({
      kind: "time-series",
      label: "History",
      granularity: "date",
    });

    const normalized = timeSeriesFieldDefinition.normalizeValue?.(
      [
        { timestamp: "2026-01-01", value: "10" },
        { timestamp: "2026-01-02", value: 12 },
        { timestamp: "invalid", value: 99 },
      ],
      config,
    );

    expect(normalized).toHaveLength(2);
    expect(normalized?.[0]?.value).toBe(10);
    expect(normalized?.[1]?.timestamp).toBeInstanceOf(Date);
    expect(timeSeriesFieldDefinition.serializeValue?.(normalized ?? [], config)).toEqual([
      { timestamp: "2026-01-01", value: 10 },
      { timestamp: "2026-01-02", value: 12 },
    ]);
  });

  it("validates time-series ordering and uniqueness", () => {
    const config = timeSeriesFieldDefinition.schema.parse({
      kind: "time-series",
      label: "History",
      ordered: "asc",
      uniqueTimestamps: true,
    });

    const errors = timeSeriesFieldDefinition.validate?.(
      [
        { timestamp: new Date("2026-01-02"), value: 10 },
        { timestamp: new Date("2026-01-01"), value: 12 },
        { timestamp: new Date("2026-01-01"), value: 13 },
      ],
      config,
      {
        field: { ...config, id: "history" },
        values: {},
        submitCount: 0,
        validationVersion: 1,
      },
    );

    expect(errors).toContain("Timestamps must be sorted in ascending order.");
  });
});
