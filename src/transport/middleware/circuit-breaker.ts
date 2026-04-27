// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { cloneCapabilities, inferTransportCapabilities } from "../capabilities";
import { transportErrorMessages } from "../constants";
import { TransportError, transportErrorCodes } from "../errors";
import { createTransport, getTransportScope, normalizeRequest, resolveStream } from "../internal";
import { createMemoryCircuitBreakerState } from "../state/circuit-breaker";
import type { CircuitBreakerOptions, SubmitRequest, TransportMiddleware } from "../types";

export const withCircuitBreaker = (options: CircuitBreakerOptions): TransportMiddleware => {
  if (options.failureThreshold < 1) {
    throw new TypeError(transportErrorMessages.circuitInvalidFailureThreshold);
  }
  if (options.resetTimeout <= 0 || !Number.isFinite(options.resetTimeout)) {
    throw new TypeError(transportErrorMessages.circuitInvalidResetTimeout);
  }

  const sharedState = options.sharedState ?? createMemoryCircuitBreakerState();
  const getScope = (request?: SubmitRequest) =>
    options.scope ??
    options.key ??
    (request ? getTransportScope(request, "transport") : "transport");

  const getSnapshot = async (request?: SubmitRequest) =>
    (await sharedState.get(getScope(request))) ?? {
      state: "closed" as const,
      failureCount: 0,
      openUntil: 0,
      halfOpenActive: 0,
    };

  const setSnapshot = async (
    snapshot: {
      state: "closed" | "open" | "half-open";
      failureCount: number;
      openUntil: number;
      halfOpenActive: number;
    },
    request?: SubmitRequest,
  ) => {
    options.onStateChange?.(snapshot.state);
    const scope = getScope(request);
    if (sharedState.compareAndSet) {
      const previous = await sharedState.get(scope);
      const updated = await sharedState.compareAndSet(scope, previous, snapshot);
      if (!updated) {
        throw new TransportError("withCircuitBreaker: shared state compare-and-set failed.", {
          code: transportErrorCodes.POLICY_STORE_CONFLICT,
          retryable: true,
        });
      }
      return;
    }
    await sharedState.set(scope, snapshot);
  };

  const beforeCall = async (request: SubmitRequest) => {
    const snapshot = await getSnapshot(request);
    const now = Date.now();
    if (snapshot.state === "open") {
      if (now >= snapshot.openUntil) {
        const nextSnapshot = {
          ...snapshot,
          state: "half-open" as const,
        };
        await setSnapshot(nextSnapshot, request);
        return nextSnapshot;
      }
      throw new TransportError(transportErrorMessages.circuitOpen("transport"), {
        code: transportErrorCodes.OPEN_CIRCUIT,
        retryable: true,
      });
    }

    if (snapshot.state === "half-open") {
      const limit = options.halfOpenMaxRequests ?? 1;
      if (snapshot.halfOpenActive >= limit) {
        throw new TransportError(transportErrorMessages.circuitOpen("transport"), {
          code: transportErrorCodes.OPEN_CIRCUIT,
          retryable: true,
        });
      }
      const nextSnapshot = {
        ...snapshot,
        halfOpenActive: snapshot.halfOpenActive + 1,
      };
      await setSnapshot(nextSnapshot, request);
      return nextSnapshot;
    }

    return snapshot;
  };

  const onSuccess = async (request: SubmitRequest) => {
    await setSnapshot(
      {
        state: "closed",
        failureCount: 0,
        openUntil: 0,
        halfOpenActive: 0,
      },
      request,
    );
  };

  const onFailure = async (request: SubmitRequest, error: unknown) => {
    if (options.tripOn && !options.tripOn(error)) {
      return;
    }

    const snapshot = await getSnapshot(request);
    const failureCount = snapshot.failureCount + 1;
    if (snapshot.state === "half-open" || failureCount >= options.failureThreshold) {
      await setSnapshot(
        {
          state: "open",
          failureCount,
          openUntil: Date.now() + options.resetTimeout,
          halfOpenActive: 0,
        },
        request,
      );
      return;
    }

    await setSnapshot(
      {
        ...snapshot,
        failureCount,
      },
      request,
    );
  };

  return (transport) =>
    createTransport(
      async (request) => {
        request = normalizeRequest(request, transport, "withCircuitBreaker");
        await beforeCall(request);
        try {
          const response = await transport.submit(request);
          await onSuccess(request);
          return response;
        } catch (error) {
          await onFailure(request, error);
          throw error;
        }
      },
      transport.stream
        ? async function* (request) {
            request = normalizeRequest(request, transport, "withCircuitBreaker.stream");
            await beforeCall(request);
            try {
              const stream = await resolveStream(transport, request);
              for await (const event of stream) {
                yield event;
              }
              await onSuccess(request);
            } catch (error) {
              await onFailure(request, error);
              throw error;
            }
          }
        : undefined,
      {
        openSession: transport.openSession,
        capabilities: cloneCapabilities(inferTransportCapabilities(transport)),
      },
    );
};
