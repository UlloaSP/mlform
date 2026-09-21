// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { JsonValue } from "@/schema";
import { EngineError } from "../errors";

const fail = (path: string, reason: string): never => {
  throw new EngineError(`Snapshot value at ${path} ${reason}.`);
};

export const cloneJsonValue = (
  value: unknown,
  path = "value",
  ancestors = new Set<object>(),
): JsonValue => {
  if (value === null || typeof value === "boolean" || typeof value === "string") return value;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return fail(path, "must be a finite number");
    return value;
  }
  if (typeof value !== "object") return fail(path, "must be JSON-compatible");
  if (ancestors.has(value)) return fail(path, "must not contain cycles");

  ancestors.add(value);
  try {
    if (Array.isArray(value)) {
      return value.map((entry, index) => cloneJsonValue(entry, `${path}[${index}]`, ancestors));
    }

    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) {
      return fail(path, "must be a plain object or array");
    }

    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        cloneJsonValue(entry, `${path}.${key}`, ancestors),
      ]),
    );
  } finally {
    ancestors.delete(value);
  }
};
