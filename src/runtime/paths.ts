// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { normalizeSubmissionPath } from "@/schema";
import { isRecord } from "./utils";

export const setPathValue = (
  target: Record<string, unknown>,
  path: readonly string[],
  value: unknown,
): void => {
  const segments = normalizeSubmissionPath(path);
  if (segments.length === 0) {
    return;
  }

  let cursor = target;
  for (const segment of segments.slice(0, -1)) {
    const current = Object.hasOwn(cursor, segment) ? cursor[segment] : undefined;
    if (!isRecord(current)) {
      const next: Record<string, unknown> = {};
      cursor[segment] = next;
      cursor = next;
      continue;
    }

    cursor = current;
  }

  cursor[segments[segments.length - 1]!] = value;
};
