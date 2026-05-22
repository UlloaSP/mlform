// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { MaybePromise } from "./types";

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

export const identity = <T>(value: T): T => value;

export const deepFreeze = <T>(value: T): T => {
  const isTypedView = typeof ArrayBuffer !== "undefined" && ArrayBuffer.isView(value);
  const isArrayBufferLike =
    (typeof ArrayBuffer !== "undefined" && value instanceof ArrayBuffer) ||
    (typeof SharedArrayBuffer !== "undefined" && value instanceof SharedArrayBuffer);
  const isBlobLike =
    (typeof Blob !== "undefined" && value instanceof Blob) ||
    (typeof File !== "undefined" && value instanceof File);

  if (
    value !== null &&
    (typeof value === "object" || typeof value === "function") &&
    !isTypedView &&
    !isArrayBufferLike &&
    !isBlobLike &&
    !Object.isFrozen(value)
  ) {
    Object.freeze(value);

    for (const nested of Object.values(value as object)) {
      deepFreeze(nested);
    }
  }

  return value;
};

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
