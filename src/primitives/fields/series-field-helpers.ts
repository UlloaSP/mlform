// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

export type SeriesSubFieldConfig = {
  kind?: unknown;
  label?: unknown;
  required?: unknown;
  options?: unknown;
  min?: unknown;
  max?: unknown;
  step?: unknown;
  unit?: unknown;
  placeholder?: unknown;
  trueLabel?: unknown;
  falseLabel?: unknown;
};

export type DraftRow = {
  key: string;
  field1: unknown;
  field2: unknown;
};

type SerializedPoint = {
  field1?: unknown;
  field2?: unknown;
};

let rowSequence = 0;

export const createRowKey = (): string => `series-row-${++rowSequence}`;

const normalizeBooleanValue = (value: unknown): boolean | "" => {
  if (value === true || value === false) {
    return value;
  }
  if (value === "true") {
    return true;
  }
  if (value === "false") {
    return false;
  }
  return "";
};

export const normalizeCellValue = (config: SeriesSubFieldConfig, value: unknown): unknown => {
  switch (config.kind) {
    case "number":
      return typeof value === "number" ? String(value) : typeof value === "string" ? value : "";
    case "date":
      return typeof value === "string" ? value : "";
    case "category":
    case "text":
      return typeof value === "string" ? value : "";
    case "boolean":
      return normalizeBooleanValue(value);
    default:
      return typeof value === "string" ? value : (value ?? "");
  }
};

export const normalizeRows = (
  value: unknown,
  field1Config: SeriesSubFieldConfig,
  field2Config: SeriesSubFieldConfig,
): DraftRow[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((point) => {
    const row = point as SerializedPoint;
    return {
      key: createRowKey(),
      field1: normalizeCellValue(field1Config, row.field1),
      field2: normalizeCellValue(field2Config, row.field2),
    } satisfies DraftRow;
  });
};

export const commitSeriesCellValue = (config: SeriesSubFieldConfig, value: unknown): unknown => {
  switch (config.kind) {
    case "number":
    case "date":
    case "category":
    case "text":
    case "boolean":
      return value === "" ? null : value;
    default:
      return value === "" ? null : value;
  }
};

export const seriesNumberUnit = (config: SeriesSubFieldConfig): string => {
  return typeof config.unit === "string" ? config.unit : "";
};
