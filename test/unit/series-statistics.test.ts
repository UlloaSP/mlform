// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { describe, expect, it, vi } from "vite-plus/test";
import {
  calculateSeriesAggregation,
  createBuiltinMlRegistry,
  type SeriesAggregation,
} from "mlform/builtins";
import { createForm, createSubmissionSnapshot } from "mlform/runtime";

const target = { label: "Statistic", source: "field1", mappedTo: "result" } as const;
const points = [1, 2, 3, 4, 8].map((field1) => ({ field1, field2: "note" }));
// Golden values generated with NumPy/SciPy on this fixed sample, independently of MLForm.
const cases: Array<[SeriesAggregation, number]> = [
  [{ ...target, operation: "count" }, 5],
  [{ ...target, operation: "distinct-count" }, 5],
  [{ ...target, operation: "sum" }, 18],
  [{ ...target, operation: "product" }, 192],
  [{ ...target, operation: "first" }, 1],
  [{ ...target, operation: "last" }, 8],
  [{ ...target, operation: "min" }, 1],
  [{ ...target, operation: "max" }, 8],
  [{ ...target, operation: "mean" }, 3.6],
  [{ ...target, operation: "median" }, 3],
  [{ ...target, operation: "mode" }, 1],
  [{ ...target, operation: "quantile", q: 0.25, method: "linear" }, 2],
  [{ ...target, operation: "range" }, 7],
  [{ ...target, operation: "iqr" }, 2],
  [{ ...target, operation: "mad" }, 1],
  [{ ...target, operation: "mean-absolute-deviation" }, 1.92],
  [{ ...target, operation: "geometric-mean" }, 2.861938162210511],
  [{ ...target, operation: "harmonic-mean" }, 2.264150943396227],
  [{ ...target, operation: "rms" }, 4.33589667773576],
  [{ ...target, operation: "variance", ddof: 0 }, 5.84],
  [{ ...target, operation: "variance", ddof: 1 }, 7.3],
  [{ ...target, operation: "stddev", ddof: 1 }, 2.701851217221259],
  [{ ...target, operation: "sem", ddof: 1 }, 1.208304597359457],
  [{ ...target, operation: "cv", ddof: 1 }, 0.7505142270059054],
  [{ ...target, operation: "skewness", bias: true }, 0.8978957037987336],
  [{ ...target, operation: "skewness", bias: false }, 1.3385038869326564],
  [{ ...target, operation: "kurtosis", bias: true, fisher: true }, -0.49474573090636165],
  [{ ...target, operation: "kurtosis", bias: false, fisher: true }, 2.0210170763745525],
  [{ ...target, operation: "kurtosis", bias: true, fisher: false }, 2.5052542690936384],
  [{ ...target, operation: "kurtosis", bias: false, fisher: false }, 5.0210170763745525],
];

const field = (aggregation: SeriesAggregation, sample = points) => ({
  kind: "series",
  label: "Measurements",
  displayKey: "Original measurements",
  columns: [
    { id: "field1", kind: "number", label: "Value" },
    { id: "field2", kind: "text", label: "Note" },
  ],
  defaultValue: sample,
  aggregations: [aggregation],
});

describe("descriptive series statistics", () => {
  it.each(cases)("calculates %j against reference values", (aggregation, expected) => {
    const original = structuredClone(points);
    expect(calculateSeriesAggregation(points, aggregation)).toBeCloseTo(expected, 12);
    expect(points).toEqual(original);
  });

  it("routes every operation through the headless submission contract", async () => {
    const aggregations = cases.map(([aggregation], index) => ({
      ...aggregation,
      mappedTo: `feature_${index}`,
    }));
    const form = createForm({
      registry: createBuiltinMlRegistry(),
      transport: { submit: vi.fn().mockResolvedValue({ reports: [] }) },
      schema: { fields: [{ ...field(aggregations[0]!), aggregations }] },
    });
    expect((await form.validate()).valid).toBe(true);
    const snapshot = createSubmissionSnapshot(form);
    for (const [index, [, expected]] of cases.entries()) {
      expect(snapshot.modelValues[`feature_${index}`]).toBeCloseTo(expected, 12);
    }
    expect(snapshot.displayValues).toEqual({ "Original measurements": points });
  });

  it.each(cases)("handles empty and missing observations for %j", (aggregation) => {
    const empty =
      aggregation.operation === "product"
        ? 1
        : ["count", "distinct-count", "sum"].includes(aggregation.operation)
          ? 0
          : null;
    expect(calculateSeriesAggregation([], aggregation)).toBe(empty);
    expect(calculateSeriesAggregation([{ field1: null, field2: "" }], aggregation)).toBeNull();
    expect(calculateSeriesAggregation([{ field1: Infinity, field2: "" }], aggregation)).toBeNull();
  });

  it("counts duplicates and preserves observation order for first and last", () => {
    const sample = [8, 2, 2, 1].map((field1) => ({ field1, field2: "" }));
    expect(calculateSeriesAggregation(sample, { ...target, operation: "distinct-count" })).toBe(3);
    expect(calculateSeriesAggregation(sample, { ...target, operation: "first" })).toBe(8);
    expect(calculateSeriesAggregation(sample, { ...target, operation: "last" })).toBe(1);
  });

  it.each(["geometric-mean", "harmonic-mean"] as const)(
    "enforces the domain of %s",
    (operation) => {
      expect(
        calculateSeriesAggregation([{ field1: 0, field2: "" }, ...points], {
          ...target,
          operation,
        }),
      ).toBe(0);
      expect(
        calculateSeriesAggregation([{ field1: -1, field2: "" }, ...points], {
          ...target,
          operation,
        }),
      ).toBeNull();
    },
  );

  it("handles zero dispersion, signed CV, large offsets and finite extreme values", () => {
    const constant = [7, 7, 7, 7].map((field1) => ({ field1, field2: "" }));
    for (const operation of ["variance", "stddev", "sem", "cv"] as const) {
      expect(calculateSeriesAggregation(constant, { ...target, operation, ddof: 1 })).toBe(0);
    }
    expect(
      calculateSeriesAggregation(constant, { ...target, operation: "skewness", bias: true }),
    ).toBeNull();
    expect(
      calculateSeriesAggregation(constant, {
        ...target,
        operation: "kurtosis",
        bias: true,
        fisher: true,
      }),
    ).toBeNull();
    const offset = [1e12 + 1, 1e12 + 2, 1e12 + 3].map((field1) => ({ field1, field2: "" }));
    expect(calculateSeriesAggregation(offset, { ...target, operation: "variance", ddof: 1 })).toBe(
      1,
    );
    const negatives = points.map((point) => ({ ...point, field1: -point.field1 }));
    expect(
      calculateSeriesAggregation(negatives, { ...target, operation: "cv", ddof: 1 }),
    ).toBeCloseTo(-0.7505142270059054, 12);
    const extreme = [-Number.MAX_VALUE, Number.MAX_VALUE].map((field1) => ({ field1, field2: "" }));
    expect(calculateSeriesAggregation(extreme, { ...target, operation: "stddev", ddof: 0 })).toBe(
      Number.MAX_VALUE,
    );
    expect(calculateSeriesAggregation(extreme, { ...target, operation: "rms" })).toBe(
      Number.MAX_VALUE,
    );
    expect(
      calculateSeriesAggregation(extreme, { ...target, operation: "variance", ddof: 0 }),
    ).toBeNull();
    expect(
      calculateSeriesAggregation([{ field1: 0, field2: "" }, ...extreme], {
        ...target,
        operation: "product",
      }),
    ).toBe(0);
  });

  it("avoids intermediate overflow in absolute deviations and derived dispersion", () => {
    const max = Number.MAX_VALUE;
    const asymmetric = [-max, max, max].map((field1) => ({ field1 }));
    const symmetric = [-max, max].map((field1) => ({ field1 }));
    expect(calculateSeriesAggregation(asymmetric, { ...target, operation: "mad" })).toBe(0);
    expect(
      calculateSeriesAggregation(asymmetric, { ...target, operation: "mean-absolute-deviation" })! /
        max,
    ).toBeCloseTo(8 / 9, 12);
    expect(
      calculateSeriesAggregation(symmetric, { ...target, operation: "sem", ddof: 1 })! / max,
    ).toBeCloseTo(1, 12);
    expect(
      calculateSeriesAggregation(asymmetric, { ...target, operation: "cv", ddof: 1 }),
    ).toBeCloseTo(Math.sqrt(12), 12);
  });

  const failures: Array<[SeriesAggregation, number[]]> = [
    [{ ...target, operation: "variance", ddof: 1 }, [1]],
    [{ ...target, operation: "stddev", ddof: 2 }, [1, 2]],
    [{ ...target, operation: "sem", ddof: 1 }, [1]],
    [{ ...target, operation: "cv", ddof: 0 }, [-1, 1]],
    [{ ...target, operation: "skewness", bias: false }, [1, 2]],
    [{ ...target, operation: "kurtosis", bias: false, fisher: true }, [1, 2, 3]],
    [{ ...target, operation: "geometric-mean" }, [-1, 2]],
    [{ ...target, operation: "harmonic-mean" }, [-1, 2]],
    [{ ...target, operation: "sum" }, [Number.MAX_VALUE, Number.MAX_VALUE]],
    [{ ...target, operation: "range" }, [-Number.MAX_VALUE, Number.MAX_VALUE]],
  ];
  it.each(failures)(
    "blocks undefined or non-finite results before transport: %j",
    async (aggregation, values) => {
      const sample = values.map((field1) => ({ field1, field2: "" }));
      const submit = vi.fn();
      const form = createForm({
        registry: createBuiltinMlRegistry(),
        schema: { fields: [field(aggregation, sample)] },
        transport: { submit },
      });
      expect(calculateSeriesAggregation(sample, aggregation)).toBeNull();
      await expect(form.submit()).rejects.toMatchObject({ name: "ValidationError" });
      expect(submit).not.toHaveBeenCalled();
    },
  );
});
