// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { describe, expect, it, vi } from "vite-plus/test";
import { z } from "zod";
import {
  createBuiltinMlRegistry,
  type SeriesColumnConfig,
  type SeriesFieldConfig,
} from "mlform/builtins";
import { createForm, createSubmissionSnapshot } from "mlform/runtime";
import { toSchemaJsonSchema, validateSchema } from "mlform/schema";

const registry = createBuiltinMlRegistry();
const number = { id: "value", kind: "number", label: "Value" };
const field = { kind: "series", label: "Measurements", columns: [number] };

describe("series columns", () => {
  it.each([1, 2, 3, 6])(
    "normalizes and submits %i explicitly named numeric columns",
    async (count) => {
      const columns = Array.from({ length: count }, (_, index) => ({
        ...number,
        id: `value_${index}`,
        label: `Value ${index}`,
        required: true,
      }));
      const rows = [0, 2].map((offset) =>
        Object.fromEntries(
          columns.map((column, index) => [column.id, String(10 * (index + 1) + offset)]),
        ),
      );
      const submit = vi.fn(async () => ({ reports: [] }));
      const config: SeriesFieldConfig = {
        kind: "series",
        id: "series",
        label: "Measurements",
        displayKey: "Original",
        mappedTo: "raw",
        columns,
        defaultValue: rows,
        aggregations: columns.map((column, index) => ({
          label: column.label,
          source: column.id,
          operation: "mean",
          mappedTo: { A: index },
        })),
      };
      expect(validateSchema({ fields: [config] }, registry).success).toBe(true);
      expect(
        z.fromJSONSchema(toSchemaJsonSchema(registry)).safeParse({ fields: [config] }).success,
      ).toBe(true);
      const form = createForm({ registry, schema: { fields: [config] }, transport: { submit } });
      await form.submit({ backend: "A" });
      const snapshot = createSubmissionSnapshot(form, { backend: "A" });
      expect(snapshot.modelValues.raw).toEqual(
        rows.map((row) =>
          Object.fromEntries(Object.entries(row).map(([key, value]) => [key, Number(value)])),
        ),
      );
      for (const index of columns.keys())
        expect(snapshot.modelValues[index]).toBe(10 * (index + 1) + 1);
      expect(snapshot.displayValues.Original).toEqual(snapshot.modelValues.raw);
      expect(submit).toHaveBeenCalledOnce();
      form.dispose();
    },
  );

  it("normalizes and validates every supported kind using its column configuration", async () => {
    const columns: SeriesColumnConfig[] = [
      { id: "date", kind: "date", label: "Date", required: true },
      { id: "value", kind: "number", label: "Value", required: true, min: 10 },
      { id: "note", kind: "text", label: "Note", minLength: 3 },
      { id: "category", kind: "category", label: "Category", options: ["a", "b"] },
      { id: "flag", kind: "boolean", label: "Flag", required: true },
    ];
    const form = createForm({
      registry,
      schema: { fields: [{ ...field, id: "series", columns, mappedTo: "rows" }] },
      transport: { submit: vi.fn() },
    });
    form.setValues({
      series: [
        {
          note: "abc",
          flag: "false",
          category: "b",
          value: "12.5",
          date: "2026-01-01",
          ignored: "extra",
        },
      ],
    });
    expect((await form.validate()).valid).toBe(true);
    expect(form.getField("series")?.state.value).toEqual([
      { date: new Date("2026-01-01"), value: 12.5, note: "abc", category: "b", flag: false },
    ]);
    expect(createSubmissionSnapshot(form).modelValues.rows).toEqual([
      { date: "2026-01-01T00:00:00.000Z", value: 12.5, note: "abc", category: "b", flag: false },
    ]);
    form.setValues({
      series: [{ date: "2026-01-01", value: 5, note: "x", category: "unknown", flag: null }],
    });
    const errors = (await form.validate()).fields.series;
    expect(errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining("(Value)"),
        expect.stringContaining("(Note)"),
        expect.stringContaining("(Category)"),
        expect.stringContaining("(Flag)"),
      ]),
    );
    form.dispose();
  });

  it("preserves column identity across ordering changes and never guesses row keys", async () => {
    const aggregation = {
      label: "Mean",
      source: "value",
      operation: "mean" as const,
      mappedTo: "mean",
    };
    const columns = [number, { id: "note", kind: "text", label: "Note" }];
    for (const ordered of [columns, columns.toReversed()]) {
      const submit = vi.fn(async () => ({ reports: [] }));
      const form = createForm({
        registry,
        schema: {
          fields: [{ ...field, id: "series", columns: ordered, aggregations: [aggregation] }],
        },
        transport: { submit },
      });
      form.setValues({
        series: [
          { note: "a", value: 10 },
          { value: 20, note: "b" },
        ],
      });
      await form.submit();
      expect(createSubmissionSnapshot(form).modelValues).toEqual({ mean: 15 });
      for (const invalid of [[10, "a"], { other: 10, note: "a" }, null]) {
        form.setValues({ series: [{ value: 20, note: "b" }, invalid] });
        expect(form.getField("series")?.state.value).toHaveLength(2);
        await expect(form.submit()).rejects.toMatchObject({ name: "ValidationError" });
      }
      expect(submit).toHaveBeenCalledOnce();
      form.dispose();
    }
  });

  it.each([
    { columns: [], path: ["columns"] },
    { columns: [{ kind: "number", label: "Value" }], path: ["columns", 0, "id"] },
    ...["", "__proto__", "constructor", "prototype", "invalid.id"].map((id) => ({
      columns: [{ ...number, id }],
      path: ["columns", 0, "id"],
    })),
    { columns: [number, number], path: ["columns", 1, "id"] },
    { columns: [{ ...number, kind: "series" }], path: ["columns", 0, "kind"] },
    { columns: [{ ...number, step: 0 }], path: ["columns", 0, "step"] },
  ])("rejects invalid columns with a precise diagnostic", ({ columns, path }) => {
    const result = validateSchema({ fields: [{ ...field, columns }] }, registry);
    expect(result).toMatchObject({
      success: false,
      issues: [expect.objectContaining({ path: ["fields", 0, ...path] })],
    });
  });

  it("rejects the replaced paired-field schema", () => {
    const old = { kind: "series", label: "Measurements", field1: number, field2: number };
    expect(validateSchema({ fields: [old] }, registry).success).toBe(false);
    expect(
      z.fromJSONSchema(toSchemaJsonSchema(registry)).safeParse({ fields: [old] }).success,
    ).toBe(false);
  });
});
