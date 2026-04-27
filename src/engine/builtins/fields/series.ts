// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import * as z from "zod";
import { builtinValidationMessages } from "../../constants";
import type { BaseFieldConfig, FieldDefinition, NormalizedFieldConfig } from "../../types";
import { isRecord } from "../../utils";
import { booleanFieldDefinition } from "./boolean";
import { categoryFieldDefinition } from "./category";
import { dateFieldDefinition } from "./date";
import { numberFieldDefinition } from "./number";
import { baseFieldShape, makeFieldDescriptor } from "../shared";
import { textFieldDefinition } from "./text";

type SeriesPoint = {
  field1: unknown;
  field2: unknown;
};

type SeriesSubFieldConfig = {
  kind: string;
  label: string;
  required?: boolean;
  [key: string]: unknown;
};

type SeriesFieldConfig = BaseFieldConfig & {
  kind: "series";
  field1: SeriesSubFieldConfig;
  field2: SeriesSubFieldConfig;
  minPoints?: number;
  maxPoints?: number;
};

const seriesSubFieldSchema: z.ZodType<SeriesSubFieldConfig> = z
  .object({
    kind: z.string().min(1),
    label: z.string().min(1),
    required: z.boolean().optional(),
  })
  .passthrough();

const requiredMessage = "This field is required.";

const formatDateValue = (value: Date): string => value.toISOString().slice(0, 10);

const builtinSeriesSubFieldDefinitions = {
  text: textFieldDefinition,
  number: numberFieldDefinition,
  date: dateFieldDefinition,
  category: categoryFieldDefinition,
} as const;

const getBuiltinSeriesSubFieldDefinition = (kind: string) => {
  return builtinSeriesSubFieldDefinitions[kind as keyof typeof builtinSeriesSubFieldDefinitions] as
    | FieldDefinition
    | undefined;
};

const normalizeBooleanValue = (value: unknown): boolean | null => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    if (value === "true") {
      return true;
    }

    if (value === "false") {
      return false;
    }
  }

  return Boolean(value);
};

const normalizeSubFieldValue = (config: SeriesSubFieldConfig, value: unknown): unknown => {
  if (config.kind === booleanFieldDefinition.kind) {
    return normalizeBooleanValue(value);
  }

  const definition = getBuiltinSeriesSubFieldDefinition(config.kind);
  if (!definition?.normalizeValue) {
    return value;
  }

  return definition.normalizeValue(value, config as never);
};

const serializeSubFieldValue = (config: SeriesSubFieldConfig, value: unknown): unknown => {
  if (value === null || value === undefined) {
    return null;
  }

  if (config.kind === "date" && value instanceof Date) {
    return formatDateValue(value);
  }

  const definition = getBuiltinSeriesSubFieldDefinition(config.kind);
  if (!definition?.serializeValue) {
    return value;
  }

  return definition.serializeValue(value as never, config as never);
};

const isSubFieldEmpty = (config: SeriesSubFieldConfig, value: unknown): boolean => {
  if (value === null || value === undefined) {
    return true;
  }

  if (typeof value === "string") {
    return value.trim().length === 0;
  }

  if (config.kind === booleanFieldDefinition.kind) {
    return value === null || value === undefined;
  }

  return false;
};

const validateSubFieldValue = (config: SeriesSubFieldConfig, value: unknown): string[] => {
  if (config.required && isSubFieldEmpty(config, value)) {
    return [requiredMessage];
  }

  if (config.kind === booleanFieldDefinition.kind) {
    if (value === null) {
      return [];
    }

    const result = booleanFieldDefinition.validate?.(value as never, config as never, {
      field: { ...config, id: config.label } as never,
      values: {},
      submitCount: 0,
      validationVersion: 0,
      signal: undefined,
    });

    return Array.isArray(result) ? result : [];
  }

  const definition = getBuiltinSeriesSubFieldDefinition(config.kind);
  if (!definition?.validate) {
    return [];
  }

  const result = definition.validate(value as never, config as never, {
    field: { ...config, id: config.label } as never,
    values: {},
    submitCount: 0,
    validationVersion: 0,
    signal: undefined,
  });

  return Array.isArray(result) ? result : [];
};

const prefixRowErrors = (index: number, label: string, errors: string[]): string[] => {
  return errors.map((error) => `Row ${index + 1} (${label}): ${error}`);
};

const extractSeriesPair = (
  value: unknown,
): {
  field1: unknown;
  field2: unknown;
} | null => {
  if (Array.isArray(value)) {
    return value.length >= 2 ? { field1: value[0], field2: value[1] } : null;
  }

  if (!isRecord(value)) {
    return null;
  }

  if ("field1" in value || "field2" in value) {
    return {
      field1: value.field1,
      field2: value.field2,
    };
  }

  const entries = Object.entries(value);
  if (entries.length < 2) {
    return null;
  }

  return {
    field1: entries[0]?.[1],
    field2: entries[1]?.[1],
  };
};

const normalizeSeriesPoint = (value: unknown, config: SeriesFieldConfig): SeriesPoint | null => {
  const pair = extractSeriesPair(value);
  if (!pair) {
    return null;
  }

  return {
    field1: normalizeSubFieldValue(config.field1, pair.field1),
    field2: normalizeSubFieldValue(config.field2, pair.field2),
  };
};

export const seriesFieldDefinition: FieldDefinition<SeriesFieldConfig, SeriesPoint[]> = {
  kind: "series",
  schema: z.object({
    kind: z.literal("series"),
    ...baseFieldShape,
    field1: seriesSubFieldSchema,
    field2: seriesSubFieldSchema,
    minPoints: z.number().int().nonnegative().optional(),
    maxPoints: z.number().int().nonnegative().optional(),
  }),
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
    const errors = new Set<string>();

    if (
      config.minPoints !== undefined &&
      config.maxPoints !== undefined &&
      config.minPoints > config.maxPoints
    ) {
      errors.add(builtinValidationMessages.invalidPointCountRange);
    }

    if (config.minPoints !== undefined && value.length < config.minPoints) {
      errors.add(builtinValidationMessages.minPoints(config.minPoints));
    }

    if (config.maxPoints !== undefined && value.length > config.maxPoints) {
      errors.add(builtinValidationMessages.maxPoints(config.maxPoints));
    }

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
  describe(config, context) {
    return makeFieldDescriptor("series-field", config as NormalizedFieldConfig<SeriesFieldConfig>, {
      value: Array.isArray(context.state.value)
        ? context.state.value.map((point) =>
            isRecord(point)
              ? {
                  field1: serializeSubFieldValue(config.field1, point.field1),
                  field2: serializeSubFieldValue(config.field2, point.field2),
                }
              : point,
          )
        : [],
      field1: config.field1,
      field2: config.field2,
      minPoints: config.minPoints,
      maxPoints: config.maxPoints,
      state: context.state.status,
      errors: context.state.errors,
    });
  },
};
