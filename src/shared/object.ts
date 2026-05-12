// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

export const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};
