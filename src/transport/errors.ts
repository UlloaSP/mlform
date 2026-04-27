// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { MLFormError } from "@/shared";

export const transportErrorCodes = {
  TIMEOUT: "TIMEOUT",
  AUTH_FAILED: "AUTH_FAILED",
  RATE_LIMITED: "RATE_LIMITED",
  OPEN_CIRCUIT: "OPEN_CIRCUIT",
  PARSE_FAILED: "PARSE_FAILED",
  UPSTREAM_5XX: "UPSTREAM_5XX",
  ABORTED: "ABORTED",
  CAPABILITY_MISMATCH: "CAPABILITY_MISMATCH",
  PAYLOAD_TOO_LARGE: "PAYLOAD_TOO_LARGE",
  SESSION_RESULT_MISSING: "SESSION_RESULT_MISSING",
  GRAPHQL_ERROR: "GRAPHQL_ERROR",
  WEBSOCKET_BUFFER_OVERFLOW: "WEBSOCKET_BUFFER_OVERFLOW",
  POLICY_STORE_CONFLICT: "POLICY_STORE_CONFLICT",
  QUORUM_NOT_REACHED: "QUORUM_NOT_REACHED",
} as const;

export type TransportErrorCode =
  | (typeof transportErrorCodes)[keyof typeof transportErrorCodes]
  | (string & {});

export class TransportError extends MLFormError {
  readonly cause: unknown;
  readonly source?: string;
  readonly status?: number;
  readonly code?: TransportErrorCode;
  readonly retryable?: boolean;
  readonly details?: unknown;
  readonly response?: unknown;

  constructor(
    message: string,
    options: {
      cause?: unknown;
      source?: string;
      status?: number;
      code?: TransportErrorCode;
      retryable?: boolean;
      details?: unknown;
      response?: unknown;
    } = {},
  ) {
    super(message);
    this.name = "TransportError";
    this.cause = options.cause;
    this.source = options.source;
    this.status = options.status;
    this.code = options.code;
    this.retryable = options.retryable;
    this.details = options.details;
    this.response = options.response;
  }
}
