import type { SubmitRequest } from "mlform/transport";
import assert from "node:assert/strict";
import { test } from "node:test";
import { createForm } from "mlform/runtime";
import { createBuiltinMlRegistry } from "mlform/builtins";
import { SERIES_SCHEMA } from "../../src/playground/series-schema.ts";

await test("demonstrates 1–4 columns, description help and all 25 supported operations", () => {
  assert.deepEqual(
    SERIES_SCHEMA.fields.map((field) => field.columns.length),
    [1, 2, 3, 4],
  );
  assert.deepEqual(
    SERIES_SCHEMA.fields.map((field) => field.showAggregationSummary),
    [true, false, true, false],
  );
  for (const field of SERIES_SCHEMA.fields) {
    assert.ok(field.description.length > 0);
    assert.notEqual(
      "showDescriptionInline" in field ? field.showDescriptionInline : undefined,
      true,
    );
  }
  const operations = new Set(
    SERIES_SCHEMA.fields.flatMap((field) => field.aggregations.map(({ operation }) => operation)),
  );
  assert.deepEqual(
    [...operations].sort(),
    [
      "min",
      "max",
      "mean",
      "median",
      "mode",
      "count",
      "distinct-count",
      "sum",
      "product",
      "first",
      "last",
      "range",
      "iqr",
      "mad",
      "mean-absolute-deviation",
      "geometric-mean",
      "harmonic-mean",
      "rms",
      "variance",
      "stddev",
      "sem",
      "cv",
      "skewness",
      "kurtosis",
      "quantile",
    ].sort(),
  );
});

await test("submits 35 numeric aggregates while retaining dates, notes and categories", async () => {
  let request: SubmitRequest | undefined;
  const form = createForm({
    registry: createBuiltinMlRegistry(),
    schema: SERIES_SCHEMA,
    transport: {
      async submit(value) {
        request = value;
        return { reports: [] };
      },
    },
  });
  await form.submit();
  assert.ok(request);
  const { modelValues: values, displayValues: observations } = request;
  assert.equal(Object.keys(values).length, 35);
  assert.ok(Object.values(values).every(Number.isFinite));
  const expected = {
    lab_mean: 12,
    lab_sd: 2,
    lab_min: 10,
    lab_max: 14,
    lab_q1: 11,
    lab_q3: 13,
    pas_max: 160,
    pas_mean: 135,
    pas_mode: 120,
    pad_median: 85,
    pad_q1: 77.5,
    pad_q3: 92.5,
    measurement_count: 4,
    pas_variance: 1100 / 3,
    pas_sd: Math.sqrt(1100 / 3),
    pas_range: 40,
    pas_iqr: 25,
    weight_first: 60,
    weight_last: 66,
    weight_sum: 252,
    weight_product: 15_713_280,
    weight_range: 6,
    weight_mad: 2,
    weight_mean_absolute_deviation: 2,
    weight_sem: Math.sqrt(20 / 3) / 2,
    weight_cv: Math.sqrt(20 / 3) / 63,
    glucose_mean: 105,
    glucose_geometric_mean: (90 * 100 * 110 * 120) ** 0.25,
    glucose_harmonic_mean: 4 / (1 / 90 + 1 / 100 + 1 / 110 + 1 / 120),
    glucose_rms: Math.sqrt(11_150),
    glucose_distinct_count: 4,
    glucose_skewness: 0,
    glucose_kurtosis: -1.2,
    glucose_p90: 117,
    heart_rate_mean: 75,
  };
  for (const [key, value] of Object.entries(expected))
    assert.ok(Math.abs(Number(values[key]) - value) < 1e-8, `${key}: ${Number(values[key])}`);
  assert.deepEqual(Object.keys(observations), [
    "Lab values",
    "Blood pressure",
    "Weight history",
    "Monitoring",
  ]);
  assert.ok(Array.isArray(observations["Weight history"]));
  assert.equal(observations["Weight history"][0].note, "Baseline");
  assert.ok(Array.isArray(observations.Monitoring));
  assert.equal(observations.Monitoring[0].context, "Fasting");
  assert.ok(observations.Monitoring[0].date instanceof Date);
  form.setValues({
    monitoring: [{ date: "2026-10-01", glucose: 90, heartRate: 60, context: "Fasting" }],
  });
  await assert.rejects(form.submit(), { name: "ValidationError" });
  form.dispose();
});
