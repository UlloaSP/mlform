// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { assertTransportCapabilities, inferTransportCapabilities } from "./capabilities";
import { transportErrorMessages } from "./constants";
import { TransportError, transportErrorCodes } from "./errors";
import type { Transport } from "./types";

export const isAbortError = (error: unknown): boolean => {
  return (
    error instanceof Error &&
    (error.name === "AbortError" || error.message.toLowerCase().includes("aborted"))
  );
};

export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return String(error);
};

export const toTransportError = (
  error: unknown,
  defaults: {
    source?: string;
    status?: number;
    code?: string;
    retryable?: boolean;
    response?: unknown;
    details?: unknown;
  } = {},
): TransportError => {
  if (error instanceof TransportError) {
    return new TransportError(error.message, {
      cause: error.cause,
      source: defaults.source ?? error.source,
      status: defaults.status ?? error.status,
      code: defaults.code ?? error.code,
      retryable: defaults.retryable ?? error.retryable,
      response: defaults.response ?? error.response,
      details: defaults.details ?? error.details,
    });
  }

  return new TransportError(getErrorMessage(error), {
    cause: error,
    ...defaults,
  });
};

const assertSafety = (
  transport: Transport,
  allowed: boolean,
  requirement: Parameters<typeof assertTransportCapabilities>[1],
  context: string,
  message: string,
): void => {
  if (allowed) {
    return;
  }

  try {
    assertTransportCapabilities(transport, requirement, context);
    return;
  } catch {
    throw new TransportError(message, {
      code: transportErrorCodes.CAPABILITY_MISMATCH,
      retryable: false,
      details: {
        capabilities: inferTransportCapabilities(transport),
      },
    });
  }
};

export const assertRetrySafe = (transport: Transport, allowUnsafeRetry = false): void => {
  assertSafety(
    transport,
    allowUnsafeRetry,
    { safety: { retrySafe: true } },
    "withRetry",
    transportErrorMessages.retryUnsafe,
  );
};

export const assertCacheSafe = (transport: Transport, allowUnsafeCache = false): void => {
  assertSafety(
    transport,
    allowUnsafeCache,
    { safety: { cacheable: true } },
    "withCache",
    transportErrorMessages.cacheUnsafe,
  );
};

export const assertHedgingSafe = (transport: Transport, allowUnsafeHedging = false): void => {
  assertSafety(
    transport,
    allowUnsafeHedging,
    { safety: { hedgeSafe: true } },
    "createHedgedTransport",
    transportErrorMessages.hedgedUnsafe,
  );
};

export const createAggregateFailure = (
  message: string,
  failures: readonly { label: string; error: unknown }[],
): TransportError => {
  const normalizedFailures = failures.map(({ label, error }) => {
    const transportError = toTransportError(error, { source: label });
    return {
      source: label,
      message: transportError.message,
      status: transportError.status,
      code: transportError.code,
      retryable: transportError.retryable,
      details: transportError.details,
    };
  });

  return new TransportError(message, {
    cause: new AggregateError(
      failures.map(({ error, label }) =>
        error instanceof Error ? error : new Error(`${label}: ${String(error)}`),
      ),
      message,
    ),
    code: "COMPOSITE_TRANSPORT_ERROR",
    retryable: normalizedFailures.every((failure) => failure.retryable !== false),
    details: {
      failures: normalizedFailures,
    },
  });
};

export const resolveErrorMessage = (
  status: number,
  statusText: string,
  payload: unknown,
): string => {
  if (payload && typeof payload === "object" && "message" in payload) {
    const message = (payload as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }

  return transportErrorMessages.requestFailed(status, statusText);
};

export const resolveErrorCode = (payload: unknown): string | undefined => {
  if (
    typeof payload !== "object" ||
    payload === null ||
    !("code" in payload) ||
    typeof (payload as { code?: unknown }).code !== "string" ||
    !(payload as { code: string }).code.trim()
  ) {
    return undefined;
  }

  return (payload as { code: string }).code;
};
