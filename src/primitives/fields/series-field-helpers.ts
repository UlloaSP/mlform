// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

export type SeriesColumnConfig = {
  id: string;
  kind?: unknown;
  label?: unknown;
  required?: unknown;
  options?: unknown;
  min?: unknown;
  max?: unknown;
  step?: unknown;
  unit?: unknown;
  placeholder?: unknown;
  minLength?: unknown;
  maxLength?: unknown;
  pattern?: unknown;
  trueLabel?: unknown;
  falseLabel?: unknown;
};

export type DraftRow = {
  key: string;
  values: Record<string, unknown>;
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

export const normalizeCellValue = (config: SeriesColumnConfig, value: unknown): unknown => {
  switch (config.kind) {
    case "number":
      return typeof value === "number" ? String(value) : typeof value === "string" ? value : "";
    case "date":
      return value instanceof Date
        ? value.toISOString().slice(0, 10)
        : typeof value === "string"
          ? /^\d{4}-\d{2}-\d{2}/u.test(value)
            ? value.slice(0, 10)
            : value
          : "";
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
  columns: readonly SeriesColumnConfig[],
): DraftRow[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((point) => {
    const row = point as Record<string, unknown>;
    return {
      key: createRowKey(),
      values: Object.fromEntries(
        columns.map((column) => [column.id, normalizeCellValue(column, row?.[column.id])]),
      ),
    } satisfies DraftRow;
  });
};

export const seriesNumberUnit = (config: SeriesColumnConfig): string => {
  return typeof config.unit === "string" ? config.unit : "";
};
