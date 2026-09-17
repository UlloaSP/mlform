// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import * as z from "zod";
import { builtinValidationMessages } from "../../constants";
import type { BaseFieldConfig, FieldDefinition } from "@/schema";
import { baseFieldShape } from "../shared";
import { booleanFieldDefinition } from "./boolean";
import { categoryFieldDefinition } from "./category";
import { dateFieldDefinition } from "./date";
import { numberFieldDefinition } from "./number";
import { textFieldDefinition } from "./text";
import { isRecord } from "./value-helpers";

export type SeriesPoint = {
  field1: unknown;
  field2: unknown;
};

export type SeriesSubFieldConfig = {
  kind: string;
  label: string;
  required?: boolean;
  [key: string]: unknown;
};

export const supportedSeriesSubFieldKinds = [
  "text",
  "number",
  "date",
  "category",
  "boolean",
] as const;

export type SeriesFieldConfig = BaseFieldConfig & {
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

export const seriesFieldSchema = z.object({
  kind: z.literal("series"),
  ...baseFieldShape,
  field1: seriesSubFieldSchema,
  field2: seriesSubFieldSchema,
  minPoints: z.number().int().nonnegative().optional(),
  maxPoints: z.number().int().nonnegative().optional(),
});

const requiredMessage = "This field is required.";

const builtinSeriesSubFieldDefinitions = {
  text: textFieldDefinition,
  number: numberFieldDefinition,
  date: dateFieldDefinition,
  category: categoryFieldDefinition,
  boolean: booleanFieldDefinition,
} as const;

const getBuiltinSeriesSubFieldDefinition = (kind: string) => {
  return builtinSeriesSubFieldDefinitions[kind as keyof typeof builtinSeriesSubFieldDefinitions] as
    | FieldDefinition
    | undefined;
};

const normalizeSubFieldValue = (config: SeriesSubFieldConfig, value: unknown): unknown => {
  const definition = getBuiltinSeriesSubFieldDefinition(config.kind);
  if (!definition?.normalizeValue) {
    return value;
  }

  return definition.normalizeValue(value, config as never);
};

export const serializeSubFieldValue = (config: SeriesSubFieldConfig, value: unknown): unknown => {
  if (value === null || value === undefined) {
    return null;
  }

  const definition = getBuiltinSeriesSubFieldDefinition(config.kind);
  if (!definition?.serializeValue) {
    return value;
  }

  return definition.serializeValue(value as never, config as never);
};

const isSubFieldEmpty = (value: unknown): boolean => {
  if (value === null || value === undefined) {
    return true;
  }

  if (typeof value === "string") {
    return value.trim().length === 0;
  }

  return false;
};

export const validateSubFieldValue = (config: SeriesSubFieldConfig, value: unknown): string[] => {
  if (config.required && isSubFieldEmpty(value)) {
    return [requiredMessage];
  }

  const definition = getBuiltinSeriesSubFieldDefinition(config.kind);
  if (!definition?.validateSync) {
    return [];
  }

  const result = definition.validateSync(value as never, config as never, {
    field: { ...config, id: config.label } as never,
    values: {},
    submitCount: 0,
    validationVersion: 0,
    signal: undefined,
  });

  return Array.isArray(result) ? result : [];
};

export const validateSeriesSubFieldConfig = (
  config: SeriesSubFieldConfig,
): { message: string; path: readonly (string | number)[] } | null => {
  const definition = getBuiltinSeriesSubFieldDefinition(config.kind);
  if (!definition) return null;

  const result = definition.schema.safeParse(config);
  if (!result.success) {
    const issue = result.error.issues[0];
    return {
      message: issue?.message ?? `Invalid ${config.kind} sub-field configuration.`,
      path:
        issue?.path.filter(
          (segment): segment is string | number =>
            typeof segment === "string" || typeof segment === "number",
        ) ?? [],
    };
  }

  let invalid: { message: string; path: readonly (string | number)[] } | null = null;
  try {
    definition.validateConfig?.(result.data, {
      fail(message, path = []) {
        invalid = { message, path };
        throw invalid;
      },
    });
  } catch (error) {
    if (error !== invalid) throw error;
  }
  return invalid;
};

export const prefixRowErrors = (index: number, label: string, errors: string[]): string[] => {
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

export const normalizeSeriesPoint = (
  value: unknown,
  config: SeriesFieldConfig,
): SeriesPoint | null => {
  const pair = extractSeriesPair(value);
  if (!pair) {
    return null;
  }

  return {
    field1: normalizeSubFieldValue(config.field1, pair.field1),
    field2: normalizeSubFieldValue(config.field2, pair.field2),
  };
};

export const validateSeriesPointCount = (
  value: SeriesPoint[],
  config: SeriesFieldConfig,
): Set<string> => {
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

  return errors;
};
