// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { BuiltinFieldDefinition } from "../shared";
import {
  normalizeSeriesPoint,
  prefixRowErrors,
  serializeSubFieldValue,
  seriesFieldSchema,
  type SeriesFieldConfig,
  type SeriesPoint,
  validateSeriesPointCount,
  validateSubFieldValue,
} from "./series-helpers";

export const seriesFieldDefinition: BuiltinFieldDefinition<SeriesFieldConfig, SeriesPoint[]> = {
  kind: "series",
  schema: seriesFieldSchema,
  getDefaultValue(config) {
    if (!Array.isArray(config.defaultValue)) {
      return [];
    }

    return config.defaultValue
      .map((point) => normalizeSeriesPoint(point, config))
      .filter((point): point is SeriesPoint => point !== null);
  },
  normalizeValue(value, config) {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .map((point) => normalizeSeriesPoint(point, config))
      .filter((point): point is SeriesPoint => point !== null);
  },
  serializeValue(value, config) {
    return value.map((point) => ({
      field1: serializeSubFieldValue(config.field1, point.field1),
      field2: serializeSubFieldValue(config.field2, point.field2),
    }));
  },
  validate(value, config) {
    const errors = validateSeriesPointCount(value, config);

    value.forEach((point, index) => {
      for (const error of prefixRowErrors(
        index,
        config.field1.label,
        validateSubFieldValue(config.field1, point.field1),
      )) {
        errors.add(error);
      }

      for (const error of prefixRowErrors(
        index,
        config.field2.label,
        validateSubFieldValue(config.field2, point.field2),
      )) {
        errors.add(error);
      }
    });

    return [...errors];
  },
};
