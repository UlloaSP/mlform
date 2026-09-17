// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { BuiltinFieldDefinition } from "../shared";
import {
  normalizeSeriesPoint,
  prefixRowErrors,
  serializeSubFieldValue,
  seriesFieldSchema,
  supportedSeriesSubFieldKinds,
  type SeriesFieldConfig,
  type SeriesPoint,
  validateSeriesPointCount,
  validateSeriesSubFieldConfig,
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
  getNestedFieldReferences(config) {
    return [
      {
        kind: config.field1.kind,
        path: ["field1", "kind"],
        unknownKindMessage: `Series field "${config.label}" uses unknown sub-field kind "${config.field1.kind}" in "field1".`,
      },
      {
        kind: config.field2.kind,
        path: ["field2", "kind"],
        unknownKindMessage: `Series field "${config.label}" uses unknown sub-field kind "${config.field2.kind}" in "field2".`,
      },
    ];
  },
  validateConfig(config, context) {
    for (const name of ["field1", "field2"] as const) {
      if (config[name].kind === "series") {
        context.fail(`Series field "${config.label}" cannot nest series in "${name}".`, [
          name,
          "kind",
        ]);
      }
      if (!(supportedSeriesSubFieldKinds as readonly string[]).includes(config[name].kind)) {
        context.fail(
          `Series field "${config.label}" does not support sub-field kind "${config[name].kind}" in "${name}".`,
          [name, "kind"],
        );
      }

      const invalidConfig = validateSeriesSubFieldConfig(config[name]);
      if (invalidConfig) {
        context.fail(
          `Series field "${config.label}" has invalid ${config[name].kind} configuration in "${name}": ${invalidConfig.message}`,
          [name, ...invalidConfig.path],
        );
      }
    }
    if (
      config.minPoints !== undefined &&
      config.maxPoints !== undefined &&
      config.minPoints > config.maxPoints
    ) {
      context.fail(
        `Series field "${config.label}" requires minPoints to be less than or equal to maxPoints.`,
        ["minPoints"],
      );
    }
  },
  validateSync(value, config) {
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
