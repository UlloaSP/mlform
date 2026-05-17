// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import * as z from "zod";
import { builtinValidationMessages } from "@/runtime/constants";
import type { BaseFieldConfig, FieldDefinition } from "@/schema";
import { isRecord } from "@/runtime/utils";
import { baseFieldShape } from "../shared";
import { booleanFieldDefinition } from "./boolean";
import { categoryFieldDefinition } from "./category";
import { dateFieldDefinition } from "./date";
import { numberFieldDefinition } from "./number";
import { textFieldDefinition } from "./text";

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

export const serializeSubFieldValue = (config: SeriesSubFieldConfig, value: unknown): unknown => {
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

export const validateSubFieldValue = (config: SeriesSubFieldConfig, value: unknown): string[] => {
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
