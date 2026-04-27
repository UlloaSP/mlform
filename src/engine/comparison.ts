// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

export const toComparablePrimitive = (value: unknown): number | string | bigint | null => {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.getTime();
  }

  if (typeof value === "number") {
    return Number.isNaN(value) ? null : value;
  }

  if (typeof value === "string") {
    const asDate = Date.parse(value);
    if (!Number.isNaN(asDate) && /^\d{4}-\d{2}-\d{2}/.test(value)) {
      return asDate;
    }

    return value;
  }

  if (typeof value === "bigint") {
    return value;
  }

  return null;
};

export const compareComparable = (left: unknown, right: unknown): -1 | 0 | 1 | null => {
  const comparableLeft = toComparablePrimitive(left);
  const comparableRight = toComparablePrimitive(right);

  if (comparableLeft === null || comparableRight === null) {
    return null;
  }

  if (typeof comparableLeft !== typeof comparableRight) {
    return null;
  }

  if (comparableLeft === comparableRight) {
    return 0;
  }

  return comparableLeft < comparableRight ? -1 : 1;
};
