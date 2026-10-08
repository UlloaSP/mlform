// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import * as z from "zod";
import { mappedToSchema } from "../shared";
import type { SeriesPoint } from "./series-types";
import {
  arithmeticMean,
  coefficientOfVariation,
  geometricMean,
  harmonicMean,
  linearQuantile,
  meanAbsoluteDeviation,
  medianAbsoluteDeviation,
  numericProduct,
  rootMeanSquare,
  smallestMode,
  standardDeviation,
  standardError,
  standardizedMoment,
  variance,
} from "./series-statistics";

const aggregationShape = {
  label: z.string().min(1),
  source: z.string().min(1),
  mappedTo: mappedToSchema.unwrap(),
};

export const seriesAggregationSchema = z.discriminatedUnion("operation", [
  z.strictObject({
    ...aggregationShape,
    operation: z.enum([
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
    ]),
  }),
  z.strictObject({
    ...aggregationShape,
    operation: z.enum(["variance", "stddev", "sem", "cv"]),
    ddof: z.number().int().nonnegative(),
  }),
  z.strictObject({
    ...aggregationShape,
    operation: z.literal("skewness"),
    bias: z.boolean(),
  }),
  z.strictObject({
    ...aggregationShape,
    operation: z.literal("kurtosis"),
    bias: z.boolean(),
    fisher: z.boolean(),
  }),
  z.strictObject({
    ...aggregationShape,
    operation: z.literal("quantile"),
    q: z.number().min(0).max(1),
    method: z.literal("linear"),
  }),
]);

export type SeriesAggregation = z.infer<typeof seriesAggregationSchema>;

/** Computes one numeric aggregate without changing point order or discarding missing values. */
export const calculateSeriesAggregation = (
  points: readonly SeriesPoint[],
  aggregation: SeriesAggregation,
): number | null => {
  const values = Array.from(points, (point) =>
    point && Object.hasOwn(point, aggregation.source) ? point[aggregation.source] : undefined,
  );
  if (
    !values.every((value): value is number => typeof value === "number" && Number.isFinite(value))
  ) {
    return null;
  }
  if (values.length === 0) {
    switch (aggregation.operation) {
      case "count":
      case "distinct-count":
      case "sum":
        return 0;
      case "product":
        return 1;
      default:
        return null;
    }
  }

  const sorted = values.toSorted((left, right) => left - right);
  let result: number;
  switch (aggregation.operation) {
    case "count":
      result = values.length;
      break;
    case "distinct-count":
      result = new Set(values).size;
      break;
    case "sum": {
      const sum = values.reduce((total, value) => total + value, 0);
      result = Number.isFinite(sum) ? sum : arithmeticMean(values) * values.length;
      break;
    }
    case "product":
      result = numericProduct(values);
      break;
    case "first":
      result = values[0]!;
      break;
    case "last":
      result = values[values.length - 1]!;
      break;
    case "min":
      result = sorted[0]!;
      break;
    case "max":
      result = sorted[sorted.length - 1]!;
      break;
    case "mean":
      result = arithmeticMean(values);
      break;
    case "median":
      result = linearQuantile(sorted, 0.5);
      break;
    case "mode":
      result = smallestMode(sorted);
      break;
    case "quantile":
      result = linearQuantile(sorted, aggregation.q);
      break;
    case "range":
      result = sorted[sorted.length - 1]! - sorted[0]!;
      break;
    case "iqr":
      result = linearQuantile(sorted, 0.75) - linearQuantile(sorted, 0.25);
      break;
    case "mad":
      result = medianAbsoluteDeviation(sorted);
      break;
    case "mean-absolute-deviation":
      result = meanAbsoluteDeviation(values);
      break;
    case "geometric-mean":
      result = geometricMean(values);
      break;
    case "harmonic-mean":
      result = harmonicMean(values);
      break;
    case "rms":
      result = rootMeanSquare(values);
      break;
    case "variance":
      result = variance(values, aggregation.ddof);
      break;
    case "stddev":
      result = standardDeviation(values, aggregation.ddof);
      break;
    case "sem":
      result = standardError(values, aggregation.ddof);
      break;
    case "cv":
      result = coefficientOfVariation(values, aggregation.ddof);
      break;
    case "skewness":
      result = standardizedMoment(values, 3, aggregation.bias);
      break;
    case "kurtosis":
      result = standardizedMoment(values, 4, aggregation.bias) - (aggregation.fisher ? 3 : 0);
      break;
  }
  return Number.isFinite(result) ? result : null;
};
