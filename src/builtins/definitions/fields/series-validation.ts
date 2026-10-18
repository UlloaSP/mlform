// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { ValidationMessageResolver } from "@/schema";
import { builtinMessage } from "../../validation-message";
import { validateSubFieldValue, type SeriesFieldConfig, type SeriesPoint } from "./series-helpers";

/** Cell diagnostics used by both runtime validation and the series presenter. */
export const getSeriesCellErrors = (
  value: readonly SeriesPoint[],
  config: SeriesFieldConfig,
  formatMessage?: ValidationMessageResolver,
): Record<string, string[]>[] => {
  const sources = new Set(config.aggregations?.map((aggregation) => aggregation.source));
  return value.map((point) =>
    Object.fromEntries(
      config.columns.map((column) => {
        const errors = validateSubFieldValue(column, point[column.id], formatMessage);
        if (
          sources.has(column.id) &&
          (typeof point[column.id] !== "number" || !Number.isFinite(point[column.id]))
        ) {
          return [column.id, [builtinMessage(formatMessage, "seriesMeasurement")]];
        }
        return [column.id, errors];
      }),
    ),
  );
};
