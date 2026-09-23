// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

export type SubmissionPathInput = string | number | readonly string[];

const unsafeSegments = new Set(["__proto__", "prototype", "constructor"]);

export const normalizeSubmissionPath = (
  value: SubmissionPathInput | undefined,
  fallback?: SubmissionPathInput,
): string[] => {
  const path = value ?? fallback;
  if (path === undefined) return [];

  const segments = Array.isArray(path) ? path : String(path).split(".");
  const normalized = segments.map((segment) => segment.trim()).filter(Boolean);
  const unsafe = normalized.find((segment) => unsafeSegments.has(segment));
  if (unsafe) throw new Error(`Unsafe submission path segment "${unsafe}".`);
  return normalized;
};
