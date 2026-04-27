// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

export const defaultEquality = <T>(previous: T, next: T): boolean => Object.is(previous, next);

export const shallowArrayEquality = <T>(previous: readonly T[], next: readonly T[]): boolean => {
  if (previous === next) {
    return true;
  }
  if (previous.length !== next.length) {
    return false;
  }

  return previous.every((value, index) => Object.is(value, next[index]));
};

export const shallowObjectEquality = (
  previous: Record<string, unknown>,
  next: Record<string, unknown>,
): boolean => {
  if (previous === next) {
    return true;
  }

  const previousKeys = Object.keys(previous);
  const nextKeys = Object.keys(next);

  if (previousKeys.length !== nextKeys.length) {
    return false;
  }

  return previousKeys.every((key) => Object.is(previous[key], next[key]));
};

export const shallowEquality = <T>(previous: T, next: T): boolean => {
  if (Object.is(previous, next)) {
    return true;
  }

  if (Array.isArray(previous) && Array.isArray(next)) {
    return shallowArrayEquality(previous, next);
  }

  if (isRecord(previous) && isRecord(next)) {
    return shallowObjectEquality(previous, next);
  }

  return false;
};
