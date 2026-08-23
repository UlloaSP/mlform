// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

export const transportErrorCodes = {
  ABORTED: "ABORTED",
} as const;

export type TransportErrorCode =
  | (typeof transportErrorCodes)[keyof typeof transportErrorCodes]
  | (string & {});

export class TransportError extends Error {
  readonly code?: TransportErrorCode;

  constructor(message: string, code?: TransportErrorCode) {
    super(message);
    this.name = "TransportError";
    this.code = code;
  }
}
