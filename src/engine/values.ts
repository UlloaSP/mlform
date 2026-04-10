// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { isRecord } from "./utils";

type TypedArrayView =
  | Int8Array
  | Uint8Array
  | Uint8ClampedArray
  | Int16Array
  | Uint16Array
  | Int32Array
  | Uint32Array
  | Float32Array
  | Float64Array
  | BigInt64Array
  | BigUint64Array;

const isTypedArray = (value: unknown): value is TypedArrayView => {
  return ArrayBuffer.isView(value) && !(value instanceof DataView);
};

const cloneArrayBufferLike = (value: ArrayBufferLike): ArrayBuffer => {
  const clone = new Uint8Array(value.byteLength);
  clone.set(new Uint8Array(value));
  return clone.buffer;
};

const cloneBlobLike = <T>(value: T): T => {
  if (typeof File !== "undefined" && value instanceof File) {
    return new File([value], value.name, {
      type: value.type,
      lastModified: value.lastModified,
    }) as T;
  }

  if (typeof Blob !== "undefined" && value instanceof Blob) {
    return value.slice(0, value.size, value.type) as T;
  }

  return value;
};

const compareByteViews = (previous: Uint8Array, next: Uint8Array): boolean => {
  return previous.length === next.length && previous.every((value, index) => value === next[index]);
};

const compareArrayBuffer = (previous: ArrayBufferLike, next: ArrayBufferLike): boolean => {
  if (previous.byteLength !== next.byteLength) {
    return false;
  }

  const previousBytes = new Uint8Array(previous);
  const nextBytes = new Uint8Array(next);
  return compareByteViews(previousBytes, nextBytes);
};

export const cloneValue = <T>(value: T): T => {
  if (value instanceof Date) {
    return new Date(value.getTime()) as T;
  }

  if (value instanceof RegExp) {
    return new RegExp(value.source, value.flags) as T;
  }

  if (value instanceof ArrayBuffer) {
    return cloneArrayBufferLike(value) as T;
  }

  if (value instanceof DataView) {
    return new DataView(
      cloneArrayBufferLike(value.buffer),
      value.byteOffset,
      value.byteLength,
    ) as T;
  }

  if (isTypedArray(value)) {
    const TypedArrayConstructor = value.constructor as {
      new (buffer: ArrayBufferLike, byteOffset?: number, length?: number): TypedArrayView;
    };

    return new TypedArrayConstructor(
      cloneArrayBufferLike(value.buffer),
      value.byteOffset,
      value.length,
    ) as T;
  }

  if (value instanceof Map) {
    return new Map(
      Array.from(value.entries(), ([key, nestedValue]) => [
        cloneValue(key),
        cloneValue(nestedValue),
      ]),
    ) as T;
  }

  if (value instanceof Set) {
    return new Set(Array.from(value.values(), (entry) => cloneValue(entry))) as T;
  }

  if (
    (typeof File !== "undefined" && value instanceof File) ||
    (typeof Blob !== "undefined" && value instanceof Blob)
  ) {
    return cloneBlobLike(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => cloneValue(item)) as T;
  }

  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [key, cloneValue(nestedValue)]),
    ) as T;
  }

  return value;
};

export const deepValueEquality = (previous: unknown, next: unknown): boolean => {
  if (Object.is(previous, next)) {
    return true;
  }

  if (previous instanceof Date && next instanceof Date) {
    return previous.getTime() === next.getTime();
  }

  if (previous instanceof RegExp && next instanceof RegExp) {
    return previous.source === next.source && previous.flags === next.flags;
  }

  if (previous instanceof ArrayBuffer && next instanceof ArrayBuffer) {
    return compareArrayBuffer(previous, next);
  }

  if (previous instanceof DataView && next instanceof DataView) {
    return (
      previous.byteOffset === next.byteOffset &&
      previous.byteLength === next.byteLength &&
      compareArrayBuffer(previous.buffer, next.buffer)
    );
  }

  if (isTypedArray(previous) && isTypedArray(next)) {
    const previousBytes = new Uint8Array(previous.buffer, previous.byteOffset, previous.byteLength);
    const nextBytes = new Uint8Array(next.buffer, next.byteOffset, next.byteLength);

    return previous.constructor === next.constructor && compareByteViews(previousBytes, nextBytes);
  }

  if (previous instanceof Map && next instanceof Map) {
    return (
      previous.size === next.size &&
      Array.from(previous.entries()).every(([key, value], index) => {
        const nextEntry = Array.from(next.entries())[index];
        return (
          nextEntry !== undefined &&
          deepValueEquality(key, nextEntry[0]) &&
          deepValueEquality(value, nextEntry[1])
        );
      })
    );
  }

  if (previous instanceof Set && next instanceof Set) {
    const remainingValues = Array.from(next.values());
    for (const value of previous.values()) {
      const matchIndex = remainingValues.findIndex((entry) => deepValueEquality(value, entry));
      if (matchIndex < 0) {
        return false;
      }
      remainingValues.splice(matchIndex, 1);
    }

    return remainingValues.length === 0;
  }

  if (
    typeof Blob !== "undefined" &&
    typeof File !== "undefined" &&
    previous instanceof Blob &&
    next instanceof Blob
  ) {
    const sameBlob = previous.size === next.size && previous.type === next.type;
    if (!sameBlob) {
      return false;
    }

    if (previous instanceof File && next instanceof File) {
      return previous.name === next.name && previous.lastModified === next.lastModified;
    }

    return true;
  }

  if (Array.isArray(previous) && Array.isArray(next)) {
    return (
      previous.length === next.length &&
      previous.every((value, index) => deepValueEquality(value, next[index]))
    );
  }

  if (isRecord(previous) && isRecord(next)) {
    const previousKeys = Object.keys(previous);
    const nextKeys = Object.keys(next);

    return (
      previousKeys.length === nextKeys.length &&
      previousKeys.every((key) => deepValueEquality(previous[key], next[key]))
    );
  }

  return false;
};
