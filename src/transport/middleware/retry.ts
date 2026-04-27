// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { cloneCapabilities, inferTransportCapabilities } from "../capabilities";
import { transportErrorMessages } from "../constants";
import { assertRetrySafe, createTransport, resolveStream, waitForDelay } from "../internal";
import type { RetryOptions, TransportMiddleware } from "../types";

const resolveBackoff = (options: RetryOptions, attempt: number): number => {
  const baseDelay = options.baseDelay ?? 1000;
  const maxDelay = options.maxDelay ?? 30_000;
  const { backoff = "exponential" } = options;

  let delay: number;

  if (typeof backoff === "function") {
    delay = backoff(attempt);
  } else if (Array.isArray(backoff)) {
    delay = backoff[Math.min(attempt, backoff.length - 1)] ?? baseDelay;
  } else if (backoff === "linear") {
    delay = baseDelay * (attempt + 1);
  } else {
    delay = baseDelay * 2 ** attempt;
  }

  delay = Math.min(delay, maxDelay);

  if (options.jitter) {
    delay = Math.floor(delay * Math.random());
  }

  return delay;
};

export const withRetry = (options: RetryOptions): TransportMiddleware => {
  if (options.attempts < 1) {
    throw new TypeError(transportErrorMessages.retryInvalidAttempts);
  }

  return (transport) => {
    assertRetrySafe(transport, options.allowUnsafeRetry);

    return createTransport(
      async (request) => {
        let lastError: unknown;

        for (let attempt = 0; attempt < options.attempts; attempt++) {
          try {
            return await transport.submit(request);
          } catch (error) {
            lastError = error;

            if (request.signal?.aborted) {
              throw error;
            }

            if (options.retryOn && !options.retryOn(error, attempt)) {
              throw error;
            }

            if (attempt < options.attempts - 1) {
              await waitForDelay(resolveBackoff(options, attempt), request.signal);
            }
          }
        }

        throw lastError;
      },
      transport.stream
        ? async function* (request) {
            let lastError: unknown;

            for (let attempt = 0; attempt < options.attempts; attempt++) {
              let emitted = false;
              try {
                const stream = await resolveStream(transport, request);
                for await (const event of stream) {
                  emitted = true;
                  yield event;
                }
                return;
              } catch (error) {
                lastError = error;

                if (request.signal?.aborted || emitted) {
                  throw error;
                }

                if (options.retryOn && !options.retryOn(error, attempt)) {
                  throw error;
                }

                if (attempt < options.attempts - 1) {
                  await waitForDelay(resolveBackoff(options, attempt), request.signal);
                }
              }
            }

            throw lastError;
          }
        : undefined,
      {
        openSession: transport.openSession,
        capabilities: cloneCapabilities(inferTransportCapabilities(transport)),
      },
    );
  };
};
