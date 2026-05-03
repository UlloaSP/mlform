// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { assertPayloadWithinLimits, assertTransportCapabilities } from "./capabilities";
import { cloneValue } from "./clone";
import { transportErrorMessages } from "./constants";
import { TransportError } from "./errors";
import { isRecord } from "./internal-core";
import type {
  SubmitRequest,
  Transport,
  TransportResponse,
  TransportSessionEvent,
  TransportStreamEvent,
} from "./types";

export const resolveStream = async (
  transport: Transport,
  request: SubmitRequest,
): Promise<AsyncIterable<TransportStreamEvent>> => {
  assertTransportCapabilities(transport, { modes: { stream: true } }, "resolveStream");
  assertPayloadWithinLimits(transport, request, "resolveStream");
  if (!transport.stream) {
    throw new TransportError(transportErrorMessages.missingStream("Transport"), {
      code: "STREAM_UNSUPPORTED",
      retryable: false,
    });
  }

  return transport.stream(request);
};

export const normalizeTransportResponse = (response: unknown): TransportResponse => {
  if (!isRecord(response)) {
    return { raw: response };
  }

  const reports = isRecord(response.reports) ? response.reports : undefined;
  const meta = isRecord(response.meta) ? response.meta : undefined;
  const raw = "raw" in response ? response.raw : response;

  return {
    reports,
    meta,
    raw,
  };
};

export const normalizeStreamEvent = (event: unknown): TransportStreamEvent => {
  if (isRecord(event) && typeof event.type === "string") {
    return event as unknown as TransportStreamEvent;
  }

  return {
    type: "chunk",
    chunk: cloneValue(event),
  };
};

export const combineSignals = (
  signals: (AbortSignal | undefined)[],
): { signal: AbortSignal; cleanup: () => void } => {
  const controller = new AbortController();
  const cleanups: (() => void)[] = [];

  for (const signal of signals) {
    if (!signal) continue;

    if (signal.aborted) {
      controller.abort(signal.reason);
      return { signal: controller.signal, cleanup: () => {} };
    }

    const onAbort = () => controller.abort(signal.reason);
    signal.addEventListener("abort", onAbort, { once: true });
    cleanups.push(() => signal.removeEventListener("abort", onAbort));
  }

  return {
    signal: controller.signal,
    cleanup: () => {
      for (const fn of cleanups) fn();
    },
  };
};

export const waitForDelay = (ms: number, signal?: AbortSignal): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason);
      return;
    }

    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);

    const onAbort = () => {
      clearTimeout(timer);
      reject(signal?.reason);
    };

    signal?.addEventListener("abort", onAbort, { once: true });
  });
};

export const withEventMeta = (
  event: TransportStreamEvent,
  meta: Record<string, unknown>,
): TransportStreamEvent => {
  return {
    ...event,
    meta: {
      ...event.meta,
      ...meta,
    },
  } as TransportStreamEvent;
};

export const toSessionStreamEvent = (event: TransportSessionEvent): TransportStreamEvent | null => {
  switch (event.type) {
    case "progress":
    case "meta":
    case "result":
    case "error":
      return event;
    case "message":
      return {
        type: "chunk",
        chunk: event.message,
        meta: {
          ...event.meta,
          session: true,
          messageType: event.message.type,
        },
      };
    case "close":
      return {
        type: "meta",
        meta: {
          ...event.meta,
          sessionClosed: true,
          reason: event.reason,
        },
      };
  }
};

export const createSubmitBackedStream = async function* (
  transport: Transport,
  request: SubmitRequest,
): AsyncIterable<TransportStreamEvent> {
  yield {
    type: "result",
    result: await transport.submit(request),
  };
};

export const resolveStreamOrSubmit = (
  transport: Transport,
  request: SubmitRequest,
): AsyncIterable<TransportStreamEvent> | PromiseLike<AsyncIterable<TransportStreamEvent>> => {
  return transport.stream
    ? transport.stream(request)
    : createSubmitBackedStream(transport, request);
};
