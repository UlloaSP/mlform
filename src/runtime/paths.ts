// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { isRecord } from "./utils";

export const normalizeValuePath = (
  path: string | string[] | undefined,
  fallback: string,
): string[] => {
  const segments = Array.isArray(path) ? path : (path ?? fallback).split(".");

  return segments.map((segment) => segment.trim()).filter(Boolean);
};

export const setPathValue = (
  target: Record<string, unknown>,
  path: readonly string[],
  value: unknown,
): void => {
  if (path.length === 0) {
    return;
  }

  let cursor = target;
  for (const segment of path.slice(0, -1)) {
    const current = cursor[segment];
    if (!isRecord(current)) {
      const next: Record<string, unknown> = {};
      cursor[segment] = next;
      cursor = next;
      continue;
    }

    cursor = current;
  }

  cursor[path[path.length - 1]!] = value;
};
