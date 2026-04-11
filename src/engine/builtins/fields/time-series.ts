// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import * as z from "zod";
import { builtinValidationMessages } from "../../constants";
import type { BaseFieldConfig, FieldDefinition, NormalizedFieldConfig } from "../../types";
import { isRecord, toDate } from "../../utils";
import { baseFieldShape, makeFieldDescriptor } from "../shared";

type TimeSeriesPoint = {
  timestamp: Date;
  value: number | null;
};

type TimeSeriesFieldConfig = BaseFieldConfig & {
  kind: "time-series";
  minPoints?: number;
  maxPoints?: number;
  granularity?: "date" | "datetime";
  ordered?: "asc" | "desc" | false;
  uniqueTimestamps?: boolean;
  minDate?: string;
  maxDate?: string;
  minValue?: number;
  maxValue?: number;
  unit?: string;
};

const normalizeNumericValue = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (typeof value === "number") {
    return Number.isNaN(value) ? null : value;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const normalizeTimeSeriesPoint = (value: unknown): TimeSeriesPoint | null => {
  if (!isRecord(value)) {
    return null;
  }

  const timestamp = toDate(value.timestamp);
  if (!timestamp) {
    return null;
  }

  return {
    timestamp,
    value: normalizeNumericValue(value.value),
  };
};

const formatDateValue = (value: Date, granularity: "date" | "datetime"): string => {
  if (granularity === "datetime") {
    return value.toISOString();
  }

  return value.toISOString().slice(0, 10);
};

export const timeSeriesFieldDefinition: FieldDefinition<TimeSeriesFieldConfig, TimeSeriesPoint[]> =
  {
    kind: "time-series",
    schema: z.object({
      kind: z.literal("time-series"),
      ...baseFieldShape,
      minPoints: z.number().int().nonnegative().optional(),
      maxPoints: z.number().int().nonnegative().optional(),
      granularity: z.enum(["date", "datetime"]).optional().default("date"),
      ordered: z
        .union([z.enum(["asc", "desc"]), z.literal(false)])
        .optional()
        .default("asc"),
      uniqueTimestamps: z.boolean().optional().default(true),
      minDate: z.string().optional(),
      maxDate: z.string().optional(),
      minValue: z.number().optional(),
      maxValue: z.number().optional(),
      unit: z.string().optional(),
    }),
    getDefaultValue(config) {
      if (!Array.isArray(config.defaultValue)) {
        return [];
      }

      return config.defaultValue
        .map((point) => normalizeTimeSeriesPoint(point))
        .filter((point): point is TimeSeriesPoint => point !== null);
    },
    normalizeValue(value) {
      if (!Array.isArray(value)) {
        return [];
      }

      return value
        .map((point) => normalizeTimeSeriesPoint(point))
        .filter((point): point is TimeSeriesPoint => point !== null);
    },
    serializeValue(value, config) {
      return value.map((point) => ({
        timestamp: formatDateValue(point.timestamp, config.granularity ?? "date"),
        value: point.value,
      }));
    },
    validate(value, config) {
      const errors: string[] = [];
      const minDate = toDate(config.minDate);
      const maxDate = toDate(config.maxDate);

      if (
        config.minPoints !== undefined &&
        config.maxPoints !== undefined &&
        config.minPoints > config.maxPoints
      ) {
        errors.push(builtinValidationMessages.invalidPointCountRange);
      }
      if (minDate && maxDate && minDate.getTime() > maxDate.getTime()) {
        errors.push(builtinValidationMessages.invalidDateRange);
      }
      if (
        config.minValue !== undefined &&
        config.maxValue !== undefined &&
        config.minValue > config.maxValue
      ) {
        errors.push(builtinValidationMessages.invalidNumericRange);
      }

      if (config.minPoints !== undefined && value.length < config.minPoints) {
        errors.push(builtinValidationMessages.minPoints(config.minPoints));
      }
      if (config.maxPoints !== undefined && value.length > config.maxPoints) {
        errors.push(builtinValidationMessages.maxPoints(config.maxPoints));
      }

      let previousTimestamp: number | null = null;
      const seenTimestamps = new Set<number>();

      for (const point of value) {
        const timestamp = point.timestamp.getTime();

        if (config.uniqueTimestamps !== false) {
          if (seenTimestamps.has(timestamp)) {
            errors.push(builtinValidationMessages.timestampsUnique);
            break;
          }
          seenTimestamps.add(timestamp);
        }

        if (minDate && timestamp < minDate.getTime()) {
          errors.push(builtinValidationMessages.dateOnOrAfter(String(config.minDate)));
        }

        if (maxDate && timestamp > maxDate.getTime()) {
          errors.push(builtinValidationMessages.dateOnOrBefore(String(config.maxDate)));
        }

        if (point.value !== null) {
          if (config.minValue !== undefined && point.value < config.minValue) {
            errors.push(builtinValidationMessages.minValue(config.minValue));
          }
          if (config.maxValue !== undefined && point.value > config.maxValue) {
            errors.push(builtinValidationMessages.maxValue(config.maxValue));
          }
        }

        if (previousTimestamp !== null && config.ordered) {
          if (config.ordered === "asc" && timestamp < previousTimestamp) {
            errors.push(builtinValidationMessages.timestampsAscending);
            break;
          }

          if (config.ordered === "desc" && timestamp > previousTimestamp) {
            errors.push(builtinValidationMessages.timestampsDescending);
            break;
          }
        }

        previousTimestamp = timestamp;
      }

      return errors;
    },
    describe(config, context) {
      return makeFieldDescriptor(
        "time-series-field",
        config as NormalizedFieldConfig<TimeSeriesFieldConfig>,
        {
          value: Array.isArray(context.state.value)
            ? context.state.value.map((point) =>
                isRecord(point) && point.timestamp instanceof Date
                  ? {
                      timestamp: formatDateValue(point.timestamp, config.granularity ?? "date"),
                      value: point.value ?? null,
                    }
                  : point,
              )
            : [],
          minPoints: config.minPoints,
          maxPoints: config.maxPoints,
          granularity: config.granularity,
          ordered: config.ordered,
          uniqueTimestamps: config.uniqueTimestamps,
          minDate: config.minDate,
          maxDate: config.maxDate,
          minValue: config.minValue,
          maxValue: config.maxValue,
          unit: config.unit,
          state: context.state.status,
          errors: context.state.errors,
        },
      );
    },
  };
