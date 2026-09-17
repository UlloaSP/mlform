// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

export type SubmissionPathInput = string | number | readonly string[];

export const normalizeSubmissionPath = (
  value: SubmissionPathInput | undefined,
  fallback?: SubmissionPathInput,
): string[] => {
  const path = value ?? fallback;
  if (path === undefined) return [];

  const segments = Array.isArray(path) ? path : String(path).split(".");
  return segments.map((segment) => segment.trim()).filter(Boolean);
};
