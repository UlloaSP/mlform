// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { BuiltinFieldDefinition } from "../shared";
import { resolveMappedTargets } from "@/schema";
import { getSeriesCellErrors } from "./series-validation";
import { calculateSeriesAggregation } from "./series-aggregations";
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
} from "./series-helpers";

export const seriesFieldDefinition: BuiltinFieldDefinition<SeriesFieldConfig, SeriesPoint[]> = {
  kind: "series",
  schema: seriesFieldSchema,
  getDefaultValue(config) {
    if (!Array.isArray(config.defaultValue)) {
      return [];
    }

    return Array.from(config.defaultValue, (point) => normalizeSeriesPoint(point, config));
  },
  normalizeValue(value, config) {
    if (!Array.isArray(value)) {
      return [];
    }

    return Array.from(value, (point) => normalizeSeriesPoint(point, config));
  },
  serializeValue(value, config) {
    return value.map((point) =>
      Object.fromEntries(
        config.columns.map((column) => [
          column.id,
          serializeSubFieldValue(column, point[column.id]),
        ]),
      ),
    );
  },
  serializeSnapshotValue(value, config) {
    return value.map((point) =>
      Object.fromEntries(
        config.columns.map((column) => {
          const cell = serializeSubFieldValue(column, point[column.id]);
          if (
            cell === null ||
            typeof cell === "string" ||
            typeof cell === "number" ||
            typeof cell === "boolean"
          ) {
            return [column.id, cell];
          }
          throw new TypeError(`Unsupported snapshot value for series column "${column.id}".`);
        }),
      ),
    );
  },
  getMappedTargets(config, context) {
    return [
      ...resolveMappedTargets(config.mappedTo, context.backend),
      ...(config.aggregations ?? []).flatMap((aggregation) =>
        resolveMappedTargets(aggregation.mappedTo, context.backend),
      ),
    ];
  },
  getSubmissionEntries(value, serializedValue, config, context) {
    if (!config.aggregations) return undefined;
    return [
      ...resolveMappedTargets(config.mappedTo, context.backend).map((target) => ({
        target,
        value: serializedValue,
      })),
      ...config.aggregations.flatMap((aggregation) =>
        resolveMappedTargets(aggregation.mappedTo, context.backend).map((target) => ({
          target,
          value: calculateSeriesAggregation(value, aggregation),
        })),
      ),
    ];
  },
  getNestedFieldReferences(config) {
    return config.columns.map((column, index) => ({
      kind: column.kind,
      path: ["columns", index, "kind"],
      unknownKindMessage: `Series field "${config.label}" uses unknown sub-field kind "${column.kind}" in "${column.id}".`,
    }));
  },
  validateConfig(config, context) {
    if (config.aggregations && config.valuePath !== undefined) {
      context.fail(
        "Series aggregations use explicit mappedTo targets; valuePath is not supported.",
        ["valuePath"],
      );
    }
    config.aggregations?.forEach((aggregation, index) => {
      const source = config.columns.find((column) => column.id === aggregation.source);
      if (!source) {
        context.fail("Series aggregation source must identify a declared column.", [
          "aggregations",
          index,
          "source",
        ]);
      }
      if (source?.kind !== "number") {
        context.fail("Series aggregations require a number sub-field.", [
          "aggregations",
          index,
          "source",
        ]);
      }
      if (resolveMappedTargets(aggregation.mappedTo, undefined).length === 0) {
        context.fail("Series aggregations require at least one mappedTo target.", [
          "aggregations",
          index,
          "mappedTo",
        ]);
      }
    });
    const ids = new Set<string>();
    for (const [index, column] of config.columns.entries()) {
      if (ids.has(column.id))
        context.fail("Series column ids must be unique.", ["columns", index, "id"]);
      ids.add(column.id);
      if (column.kind === "series") {
        context.fail(`Series field "${config.label}" cannot nest series in "${column.id}".`, [
          "columns",
          index,
          "kind",
        ]);
      }
      if (!(supportedSeriesSubFieldKinds as readonly string[]).includes(column.kind)) {
        context.fail(
          `Series field "${config.label}" does not support sub-field kind "${column.kind}" in "${column.id}".`,
          ["columns", index, "kind"],
        );
      }

      const invalidConfig = validateSeriesSubFieldConfig(column);
      if (invalidConfig) {
        context.fail(
          `Series field "${config.label}" has invalid ${column.kind} configuration in "${column.id}": ${invalidConfig.message}`,
          ["columns", index, ...invalidConfig.path],
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
    getSeriesCellErrors(value, config).forEach((cells, index) => {
      for (const column of config.columns) {
        for (const error of prefixRowErrors(index, column.label, cells[column.id]))
          errors.add(error);
      }
    });

    if (value.length > 0 && errors.size === 0) {
      for (const aggregation of config.aggregations ?? []) {
        if (calculateSeriesAggregation(value, aggregation) === null) {
          errors.add(
            `${config.columns.find((column) => column.id === aggregation.source)?.label}: Check the measurements and ensure there are enough values to calculate a result.`,
          );
        }
      }
    }

    return [...errors];
  },
};
