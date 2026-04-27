// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * Minimal deep clone for transport-layer data: plain objects, arrays, Date,
 * Map, Set, and primitives. Does **not** handle File, Blob, TypedArray, or
 * DataView — use the engine-level {@link cloneValue} for those.
 */
export const cloneValue = <T>(value: T): T => {
  if (value === null || typeof value !== "object") return value;

  if (value instanceof Date) return new Date(value.getTime()) as T;

  if (value instanceof Map) {
    return new Map(Array.from(value.entries(), ([k, v]) => [cloneValue(k), cloneValue(v)])) as T;
  }

  if (value instanceof Set) {
    return new Set(Array.from(value, (v) => cloneValue(v))) as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => cloneValue(item)) as T;
  }

  if (isRecord(value)) {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value)) {
      out[key] = cloneValue(value[key]);
    }
    return out as T;
  }

  return value;
};
