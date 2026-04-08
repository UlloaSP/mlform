// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { MaybePromise } from "./types";

export const slugify = (value: string): string => {
  const normalized = value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "item";
};

export const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const isObjectLike = (value: unknown): value is Record<PropertyKey, unknown> | Function => {
  return (typeof value === "object" && value !== null) || typeof value === "function";
};

export const isPromiseLike = <T>(value: MaybePromise<T>): value is PromiseLike<T> => {
  return isObjectLike(value) && "then" in value && typeof value.then === "function";
};

export const isEmptyValue = (value: unknown): boolean => {
  if (value === null || value === undefined) {
    return true;
  }
  if (typeof value === "string") {
    return value.trim() === "";
  }
  if (Array.isArray(value)) {
    return value.length === 0;
  }
  if (value instanceof Date) {
    return Number.isNaN(value.getTime());
  }
  return false;
};

export const toDate = (value: unknown): Date | null => {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
};

export const identity = <T>(value: T): T => value;

export const defaultEquality = <T>(previous: T, next: T): boolean => Object.is(previous, next);

export const delay = (ms: number, signal?: AbortSignal): Promise<void> => {
  if (ms <= 0) {
    return Promise.resolve();
  }

  return new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);

    const onAbort = () => {
      clearTimeout(timeout);
      reject(signal?.reason ?? new Error("Operation aborted."));
    };

    if (signal?.aborted) {
      onAbort();
      return;
    }

    signal?.addEventListener("abort", onAbort, { once: true });
  });
};

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

const toComparablePrimitive = (value: unknown): number | string | null => {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.getTime();
  }

  if (typeof value === "number") {
    return Number.isNaN(value) ? null : value;
  }

  if (typeof value === "string") {
    const asDate = Date.parse(value);
    if (!Number.isNaN(asDate) && /^\d{4}-\d{2}-\d{2}/.test(value)) {
      return asDate;
    }

    return value;
  }

  if (typeof value === "bigint") {
    return Number(value);
  }

  return null;
};

export const compareComparable = (left: unknown, right: unknown): -1 | 0 | 1 | null => {
  const comparableLeft = toComparablePrimitive(left);
  const comparableRight = toComparablePrimitive(right);

  if (comparableLeft === null || comparableRight === null) {
    return null;
  }

  if (typeof comparableLeft !== typeof comparableRight) {
    return null;
  }

  if (comparableLeft === comparableRight) {
    return 0;
  }

  return comparableLeft < comparableRight ? -1 : 1;
};
