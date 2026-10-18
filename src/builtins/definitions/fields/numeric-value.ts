// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

export const normalizeNumericValue = (value: unknown): number | string | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : String(value);
  if (typeof value !== "string") return "[invalid numeric value]";
  const text = value.trim();
  if (!text) return null;
  // A single comma is a decimal separator, never a grouping separator.
  const decimal = text.replace(",", ".");
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(decimal)) return value;
  const parsed = Number(decimal);
  if (!Number.isFinite(parsed)) return value;
  if (parsed === 0 && /[1-9]/.test(decimal.split(/e/i)[0])) return value;
  // Reject integer text that Number would silently round to a different integer.
  if (/^[+-]?\d+$/.test(decimal) && BigInt(decimal) !== BigInt(parsed)) return value;
  return parsed;
};
