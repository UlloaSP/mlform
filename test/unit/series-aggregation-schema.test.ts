// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { describe, expect, it } from "vite-plus/test";
import { z } from "zod";
import { createBuiltinMlRegistry } from "mlform/builtins";
import { toSchemaJsonSchema, validateSchema } from "mlform/schema";

const registry = createBuiltinMlRegistry();
const mean = { label: "Mean", source: "field1", operation: "mean", mappedTo: "mean" };
const field = {
  kind: "series",
  label: "Measurements",
  columns: [
    { id: "field1", kind: "number", label: "Value" },
    { id: "field2", kind: "text", label: "Note" },
  ],
  aggregations: [mean],
};

describe("series aggregation schema", () => {
  it.each([
    { operation: "quantile", q: 0.25, method: "linear" },
    { operation: "min" },
    { operation: "max" },
    { operation: "mean" },
    { operation: "median" },
    { operation: "mode" },
    ...[
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
    ].map((operation) => ({ operation })),
    ...["variance", "stddev", "sem", "cv"].map((operation) => ({ operation, ddof: 1 })),
    { operation: "skewness", bias: false },
    { operation: "kurtosis", bias: true, fisher: false },
  ])("accepts $operation in normalization and generated JSON Schema", (options) => {
    const schema = { fields: [{ ...field, aggregations: [{ ...mean, ...options }] }] };
    expect(validateSchema(schema, registry).success).toBe(true);
    expect(z.fromJSONSchema(toSchemaJsonSchema(registry)).safeParse(schema).success).toBe(true);
  });

  it.each([
    { options: { operation: "quantile", q: 0.25 }, key: "method" },
    { options: { operation: "quantile", q: 2, method: "linear" }, key: "q" },
    { options: { operation: "quantile", q: 0.25, method: "nearest" }, key: "method" },
    { options: { operation: "max", q: 0.25 }, key: "q" },
    { options: { mappedTo: undefined }, key: "mappedTo" },
    { options: { operation: "variance" }, key: "ddof" },
    { options: { operation: "stddev", ddof: -1 }, key: "ddof" },
    { options: { operation: "sem", ddof: 0.5 }, key: "ddof" },
    { options: { operation: "cv", ddof: Infinity }, key: "ddof" },
    { options: { operation: "skewness" }, key: "bias" },
    { options: { operation: "kurtosis", bias: true }, key: "fisher" },
    { options: { operation: "count", ddof: 1 }, key: "ddof" },
  ])("rejects invalid aggregate configuration: $key", ({ options }) => {
    const schema = { fields: [{ ...field, aggregations: [{ ...mean, ...options }] }] };
    expect(validateSchema(schema, registry).success).toBe(false);
    expect(z.fromJSONSchema(toSchemaJsonSchema(registry)).safeParse(schema).success).toBe(false);
  });

  it.each([
    {
      override: { aggregations: [{ ...mean, source: "missing" }] },
      path: ["aggregations", 0, "source"],
    },
    {
      override: { aggregations: [{ ...mean, source: "field2" }] },
      path: ["aggregations", 0, "source"],
    },
    {
      override: { aggregations: [{ ...mean, mappedTo: { unused: null } }] },
      path: ["aggregations", 0, "mappedTo"],
    },
    { override: { valuePath: "raw" }, path: ["valuePath"] },
  ])("reports precise paths for incoherent contracts", ({ override, path }) => {
    const result = validateSchema({ fields: [{ ...field, ...override }] }, registry);
    expect(result).toMatchObject({
      success: false,
      issues: [expect.objectContaining({ path: ["fields", 0, ...path] })],
    });
  });

  it.each([
    [{ ...field, aggregations: [mean, { ...mean, label: "Second" }] }],
    [{ ...field, mappedTo: "mean" }],
    [field, { kind: "number", label: "Other", mappedTo: "mean" }],
    [{ ...field, mappedTo: "mean.raw" }],
    [{ ...field, aggregations: [{ ...mean, mappedTo: "__proto__.mean" }] }],
  ])("rejects duplicate, overlapping, or unsafe targets", (...fields) => {
    expect(validateSchema({ fields }, registry).success).toBe(false);
  });

  it("accepts explicit summary visibility and rejects non-boolean values", () => {
    for (const showAggregationSummary of [true, false]) {
      const schema = { fields: [{ ...field, showAggregationSummary }] };
      expect(validateSchema(schema, registry).success).toBe(true);
      expect(z.fromJSONSchema(toSchemaJsonSchema(registry)).safeParse(schema).success).toBe(true);
    }
    expect(
      validateSchema({ fields: [{ ...field, showAggregationSummary: "yes" }] }, registry).success,
    ).toBe(false);
  });
});
