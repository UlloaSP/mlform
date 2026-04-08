// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

export const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

export const joinMessages = (messages: readonly string[]): string => {
  return messages.join(" ");
};

export const toText = (value: unknown, fallback = ""): string => {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return fallback;
};
