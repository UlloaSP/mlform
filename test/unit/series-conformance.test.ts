// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { describe, expect, it, vi } from "vite-plus/test";
import { createBuiltinMlRegistry, seriesFieldDefinition } from "mlform/builtins";
import { createForm } from "mlform/runtime";

const baseConfig = {
  kind: "series" as const,
  label: "Observations",
  field2: { kind: "text", label: "Note" },
};

const subFieldCases = [
  {
    kind: "text",
    config: { kind: "text", label: "Text" },
    input: 12,
    normalized: "12",
    serialized: "12",
  },
  {
    kind: "number",
    config: { kind: "number", label: "Number" },
    input: "12.5",
    normalized: 12.5,
    serialized: 12.5,
  },
  {
    kind: "date",
    config: { kind: "date", label: "Date" },
    input: "2026-01-02",
    normalized: new Date("2026-01-02T00:00:00.000Z"),
    serialized: "2026-01-02T00:00:00.000Z",
  },
  {
    kind: "category",
    config: { kind: "category", label: "Category", options: ["alpha", "beta"] },
    input: "beta",
    normalized: "beta",
    serialized: "beta",
  },
  {
    kind: "boolean",
    config: { kind: "boolean", label: "Boolean" },
    input: "false",
    normalized: false,
    serialized: false,
  },
] as const;

describe("series conformance", () => {
  it.each(subFieldCases)("reuses the $kind value contract for nested fields", (testCase) => {
    const config = seriesFieldDefinition.schema.parse({
      ...baseConfig,
      field1: testCase.config,
    });
    const value = seriesFieldDefinition.normalizeValue?.(
      [{ field1: testCase.input, field2: "note" }],
      config,
    );
    const serialized = seriesFieldDefinition.serializeValue?.(value ?? [], config) as
      | Array<{ field1: unknown }>
      | undefined;

    expect(value?.[0]?.field1).toEqual(testCase.normalized);
    expect(serialized?.[0]?.field1).toEqual(testCase.serialized);
  });

  it("preserves caller order and duplicate timestamps", () => {
    const config = seriesFieldDefinition.schema.parse({
      kind: "series",
      label: "History",
      field1: { kind: "date", label: "Date" },
      field2: { kind: "number", label: "Value" },
    });
    const input = [
      { field1: "2026-01-02", field2: 2 },
      { field1: "2026-01-01", field2: 1 },
      { field1: "2026-01-01", field2: 3 },
    ];
    const normalized = seriesFieldDefinition.normalizeValue?.(input, config) ?? [];

    expect(seriesFieldDefinition.serializeValue?.(normalized, config)).toEqual([
      { field1: "2026-01-02T00:00:00.000Z", field2: 2 },
      { field1: "2026-01-01T00:00:00.000Z", field2: 1 },
      { field1: "2026-01-01T00:00:00.000Z", field2: 3 },
    ]);
  });

  it.each([
    {
      field1: { kind: "category", label: "Category" },
      message: /invalid category configuration/iu,
      path: ["fields", 0, "field1", "options"],
    },
    {
      field1: { kind: "number", label: "Number", step: 0 },
      message: /invalid number configuration/iu,
      path: ["fields", 0, "field1", "step"],
    },
    {
      field1: { kind: "text", label: "Text", minLength: 4, maxLength: 2 },
      message: /minimum length cannot exceed maximum length/iu,
      path: ["fields", 0, "field1", "minLength"],
    },
    {
      field1: { kind: "text", label: "Text", pattern: "[" },
      message: /valid regular expression/iu,
      path: ["fields", 0, "field1", "pattern"],
    },
    {
      field1: { kind: "number", label: "Number", min: 2, max: 1 },
      message: /minimum value cannot exceed maximum value/iu,
      path: ["fields", 0, "field1", "min"],
    },
    {
      field1: { kind: "date", label: "Date", min: "2026-02-01", max: "2026-01-01" },
      message: /minimum date cannot be after maximum date/iu,
      path: ["fields", 0, "field1", "min"],
    },
  ])("rejects invalid nested configuration before runtime", ({ field1, message, path }) => {
    let thrown: unknown;
    try {
      createForm({
        registry: createBuiltinMlRegistry(),
        schema: {
          fields: [
            {
              kind: "series",
              label: "History",
              field1,
              field2: { kind: "text", label: "Note" },
            },
          ],
        },
        transport: { submit: vi.fn() },
      });
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toMatchObject({ name: "SchemaNormalizationError", path });
    expect((thrown as Error).message).toMatch(message);
  });
});
