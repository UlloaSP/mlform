// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

/**
 * Recursively freezes an object and all nested plain objects/arrays.
 * Returns the same reference typed as readonly.
 */
export const deepFreeze = <T>(value: T): T => {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const v of Object.values(value as object)) {
      deepFreeze(v);
    }
  }
  return value;
};
