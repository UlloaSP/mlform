// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { describe, expect, it, vi } from "vite-plus/test";
import {
  calculateSeriesAggregation,
  createBuiltinMlRegistry,
  type SeriesAggregation,
  type SeriesPoint,
} from "mlform/builtins";
import { createForm } from "mlform/runtime";

describe("sparse series observations", () => {
  const sample = (): SeriesPoint[] => {
    const points = [{ value: 10 }, { value: 20 }];
    points.length = 3;
    return points;
  };
  const target = { label: "Statistic", source: "value", mappedTo: "statistic" };
  const aggregates: SeriesAggregation[] = [
    { ...target, operation: "mean" },
    { ...target, operation: "count" },
    { ...target, operation: "stddev", ddof: 0 },
  ];

  it.each(aggregates)("rejects holes when calculating $operation directly", (aggregation) => {
    expect(calculateSeriesAggregation(sample(), aggregation)).toBeNull();
  });

  it.each(["defaultValue", "setValues"])(
    "blocks incomplete observations from %s before transport",
    async (path) => {
      const submit = vi.fn(async () => ({ reports: [] }));
      const form = createForm({
        registry: createBuiltinMlRegistry(),
        schema: {
          fields: [
            {
              id: "series",
              kind: "series",
              label: "Measurements",
              columns: [{ id: "value", kind: "number", label: "Value" }],
              defaultValue: path === "defaultValue" ? sample() : [],
              aggregations: [aggregates[0]],
            },
          ],
        },
        transport: { submit },
      });
      if (path === "setValues") form.setValues({ series: sample() });
      expect(form.getField("series")?.state.value).toEqual([
        { value: 10 },
        { value: 20 },
        { value: null },
      ]);
      await expect(form.submit()).rejects.toMatchObject({ name: "ValidationError" });
      expect(submit).not.toHaveBeenCalled();
      form.dispose();
    },
  );
});
