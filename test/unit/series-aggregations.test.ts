// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { describe, expect, it, vi } from "vite-plus/test";
import {
  calculateSeriesAggregation,
  createBuiltinMlRegistry,
  type SeriesAggregation,
  type SeriesFieldConfig,
} from "mlform/builtins";
import { createForm, createSubmissionSnapshot } from "mlform/runtime";

const points = [
  { field1: 140, field2: 90 },
  { field1: 120, field2: 80 },
  { field1: 120, field2: 70 },
  { field1: 160, field2: 100 },
];
const aggregation = (operation: "min" | "max" | "mean" | "median" | "mode"): SeriesAggregation => ({
  label: operation,
  source: "field1",
  operation,
  mappedTo: operation,
});
const config: SeriesFieldConfig = {
  id: "pressure",
  kind: "series",
  label: "Blood pressure",
  displayKey: "Measurements",
  columns: [
    { id: "field1", kind: "number", label: "Systolic" },
    { id: "field2", kind: "number", label: "Diastolic" },
  ],
  defaultValue: points,
  aggregations: [aggregation("max"), aggregation("mean"), aggregation("mode")],
};
const makeForm = (field = config, submit = vi.fn().mockResolvedValue({ reports: [] })) =>
  createForm({
    registry: createBuiltinMlRegistry(),
    schema: { fields: [field] },
    transport: { submit },
  });

describe("series aggregations", () => {
  it.each([
    ["min", 120],
    ["max", 160],
    ["mean", 135],
    ["median", 130],
    ["mode", 120],
  ] as const)("calculates %s without changing the observations", (operation, expected) => {
    const original = structuredClone(points);
    expect(calculateSeriesAggregation(points, aggregation(operation))).toBe(expected);
    expect(points).toEqual(original);
  });

  it.each([
    [0, 1],
    [0.25, 2.25],
    [0.5, 3.5],
    [0.75, 6.25],
    [1, 10],
  ])("calculates the linear quantile at %s", (q, expected) => {
    const sample = [10, 7, 4, 3, 2, 1].map((field2) => ({ field1: 0, field2 }));
    expect(
      calculateSeriesAggregation(sample, {
        label: "Quantile",
        source: "field2",
        operation: "quantile",
        q,
        method: "linear",
        mappedTo: "q",
      }),
    ).toBe(expected);
  });

  it("uses the smallest mode for ties, including all-distinct values", () => {
    for (const values of [
      [4, 2, 4, 2],
      [4, 2, 3],
    ]) {
      expect(
        calculateSeriesAggregation(
          values.map((field1) => ({ field1, field2: null })),
          aggregation("mode"),
        ),
      ).toBe(2);
    }
  });

  it("handles one observation and finite extremes", () => {
    const measurements = [180, 140, 120, 160, 100].map((field1) => ({ field1, field2: 0 }));
    expect(calculateSeriesAggregation(measurements, aggregation("mean"))).toBe(140);
    expect(calculateSeriesAggregation([{ field1: 7, field2: 0 }], aggregation("median"))).toBe(7);
    const extremes = [Number.MAX_VALUE, Number.MAX_VALUE].map((field1) => ({ field1, field2: 0 }));
    expect(calculateSeriesAggregation(extremes, aggregation("mean"))).toBe(Number.MAX_VALUE);
    expect(calculateSeriesAggregation(extremes, aggregation("median"))).toBe(Number.MAX_VALUE);
    const tiny = [Number.MIN_VALUE, Number.MIN_VALUE].map((field1) => ({ field1, field2: 0 }));
    expect(calculateSeriesAggregation(tiny, aggregation("mean"))).toBe(Number.MIN_VALUE);
    expect(calculateSeriesAggregation(tiny, aggregation("median"))).toBe(Number.MIN_VALUE);
  });

  it.each([null, "", "bad", Number.POSITIVE_INFINITY, Number.NaN])(
    "does not silently discard missing or non-finite values: %s",
    (field1) => {
      expect(
        calculateSeriesAggregation([...points, { field1, field2: 0 }], aggregation("max")),
      ).toBeNull();
    },
  );

  it("keeps observations in display values and emits only declared numeric features", async () => {
    const submit = vi.fn().mockResolvedValue({ reports: [] });
    const form = makeForm(config, submit);
    const snapshot = createSubmissionSnapshot(form);
    expect(snapshot.displayValues).toEqual({ Measurements: points });
    expect(snapshot.modelValues).toEqual({ max: 160, mean: 135, mode: 120 });
    expect(snapshot.inputs[0]).toMatchObject({
      value: points,
      serializedValue: points,
      modelValues: snapshot.modelValues,
    });
    expect(form.getFieldByMappedTo("mean")?.id).toBe("pressure");
    await form.submit();
    expect(submit).toHaveBeenCalledWith(
      expect.objectContaining({ modelValues: snapshot.modelValues }),
    );
    expect(form.getValues()).toEqual({ pressure: points });
  });

  it("recalculates after edits and restores the original observations from snapshots", () => {
    const form = makeForm();
    const saved = form.createSnapshot();
    form.setValues({ pressure: [{ field1: "180", field2: 95 }] });
    expect(createSubmissionSnapshot(form).modelValues).toEqual({ max: 180, mean: 180, mode: 180 });
    form.restoreSnapshot(saved);
    expect(createSubmissionSnapshot(form).modelValues).toEqual({ max: 160, mean: 135, mode: 120 });
    form.reset();
    expect(form.getValues().pressure).toEqual(points);
  });

  it("can also send the serialized series and respects backend-specific destinations", async () => {
    const submit = vi.fn().mockResolvedValue({ reports: [] });
    const form = makeForm(
      {
        ...config,
        mappedTo: "raw",
        aggregations: [
          { ...aggregation("max"), mappedTo: { a: "pas_max", b: 0 } },
          { ...aggregation("mean"), mappedTo: { a: "pas_mean" } },
        ],
      },
      submit,
    );
    expect(createSubmissionSnapshot(form, { backend: "a" }).modelValues).toEqual({
      raw: points,
      pas_max: 160,
      pas_mean: 135,
    });
    expect(createSubmissionSnapshot(form, { backend: "b" }).modelValues).toEqual({
      raw: points,
      "0": 160,
    });
    expect(form.getFieldByMappedTo(0, { backend: "b" })?.id).toBe("pressure");
    await form.submit({ backend: "b" });
    expect(submit).toHaveBeenCalledWith(
      expect.objectContaining({ backend: "b", modelValues: { raw: points, "0": 160 } }),
    );
  });

  it("returns null for optional empty series and blocks required empty series", async () => {
    const optional = makeForm({ ...config, defaultValue: [] });
    expect((await optional.validate()).valid).toBe(true);
    expect(createSubmissionSnapshot(optional).modelValues).toEqual({
      max: null,
      mean: null,
      mode: null,
    });
    const required = makeForm({ ...config, defaultValue: [], required: true });
    await expect(required.submit()).rejects.toMatchObject({ name: "ValidationError" });
  });

  it.each([null, "bad", Number.POSITIVE_INFINITY, Number.NaN])(
    "blocks incomplete or non-finite aggregated columns before transport: %s",
    async (field1) => {
      const submit = vi.fn();
      const form = makeForm({ ...config, defaultValue: [{ field1, field2: 80 }] }, submit);
      await expect(form.submit()).rejects.toMatchObject({ name: "ValidationError" });
      expect(form.getField("pressure")?.state.errors).toContain(
        "Row 1 (Systolic): Enter a finite number in every measurement.",
      );
      expect(submit).not.toHaveBeenCalled();
    },
  );

  it("respects submission exclusion and inactive policies for all aggregate destinations", () => {
    const omitted = makeForm({ ...config, hidden: true, inactiveFieldPolicy: "omit" });
    expect(createSubmissionSnapshot(omitted).modelValues).toEqual({});
    const excluded = makeForm({ ...config, includeInSubmission: false });
    expect(createSubmissionSnapshot(excluded)).toEqual({
      inputs: [],
      displayValues: {},
      modelValues: {},
    });
  });

  it("preserves ordinary series mappedTo and valuePath serialization", () => {
    for (const field of [
      { ...config, aggregations: undefined, mappedTo: "raw" },
      { ...config, aggregations: undefined, valuePath: ["raw", "points"] },
    ]) {
      const form = makeForm(field);
      expect(createSubmissionSnapshot(form).modelValues).toEqual(
        field.mappedTo ? { raw: points } : { raw: { points } },
      );
    }
  });
});
