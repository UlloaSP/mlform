// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import {
  assertPayloadWithinLimits,
  assertTransportCapabilities,
  inferTransportCapabilities,
  normalizeTransportCapabilities,
} from "./capabilities";
import { cloneValue } from "./clone";
import { transportDefaults, transportErrorMessages } from "./constants";
import { TransportError, transportErrorCodes } from "./errors";
import type {
  CapabilityRequirement,
  MaybePromise,
  SubmitRequest,
  Transport,
  TransportCapabilities,
  TransportCollection,
  TransportResponse,
  TransportSession,
  TransportSessionEvent,
  TransportStreamEvent,
} from "./types";
import { getTransportPolicyContext, withTransportPolicyContext } from "./policy-context";

// ---------------------------------------------------------------------------
// Internal types
// ---------------------------------------------------------------------------

export type TransportEntry = {
  id: string | undefined;
  index: number;
  label: string;
  transport: Transport;
};

export type StreamFactory = (
  request: SubmitRequest,
) => AsyncIterable<TransportStreamEvent> | PromiseLike<AsyncIterable<TransportStreamEvent>>;

type SessionFactory = (request: SubmitRequest) => TransportSession | PromiseLike<TransportSession>;

export type AsyncQueue<T> = {
  push(value: T): void;
  close(): void;
  [Symbol.asyncIterator](): AsyncIterator<T>;
};

// ---------------------------------------------------------------------------
// Record check
// ---------------------------------------------------------------------------

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

// ---------------------------------------------------------------------------
// Abort detection
// ---------------------------------------------------------------------------

export const isAbortError = (error: unknown): boolean => {
  return (
    error instanceof Error &&
    (error.name === "AbortError" || error.message.toLowerCase().includes("aborted"))
  );
};

// ---------------------------------------------------------------------------
// createTransport — wraps submit/stream/session + capabilities
// ---------------------------------------------------------------------------

export const createTransport = (
  submit: Transport["submit"],
  stream?: StreamFactory,
  options?: {
    openSession?: SessionFactory;
    capabilities?: TransportCapabilities;
  },
): Transport => {
  const transport: Transport = { submit };
  if (stream) {
    transport.stream = stream;
  }
  if (options?.openSession) {
    transport.openSession = options.openSession;
  }
  transport.capabilities = normalizeTransportCapabilities(options?.capabilities, {
    modes: {
      submit: true,
      stream: Boolean(stream),
      session: Boolean(options?.openSession),
    },
    delivery: {
      mode: options?.openSession ? "session" : stream ? "stream" : "request-response",
      consistency: "unknown",
      backpressure: options?.openSession ? "bounded-buffer" : "none",
    },
  });
  return transport;
};

// ---------------------------------------------------------------------------
// Async queue
// ---------------------------------------------------------------------------

export const createAsyncQueue = <T>(): AsyncQueue<T> => {
  const values: T[] = [];
  const waiters: ((result: IteratorResult<T>) => void)[] = [];
  let closed = false;

  return {
    push(value) {
      if (closed) {
        return;
      }

      const waiter = waiters.shift();
      if (waiter) {
        waiter({ value, done: false });
        return;
      }

      values.push(value);
    },
    close() {
      if (closed) {
        return;
      }
      closed = true;
      while (waiters.length > 0) {
        waiters.shift()?.({ value: undefined as T, done: true });
      }
    },
    [Symbol.asyncIterator]() {
      return {
        next: () => {
          const value = values.shift();
          if (value !== undefined) {
            return Promise.resolve({ value, done: false });
          }

          if (closed) {
            return Promise.resolve({ value: undefined as T, done: true });
          }

          return new Promise<IteratorResult<T>>((resolve) => {
            waiters.push(resolve);
          });
        },
      };
    },
  };
};

// ---------------------------------------------------------------------------
// Stream resolution
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Header merging
// ---------------------------------------------------------------------------

export const mergeHeaders = (
  baseHeaders: HeadersInit | undefined,
  extraHeaders: HeadersInit | undefined,
): Headers => {
  const headers = new Headers(baseHeaders);
  if (!extraHeaders) {
    return headers;
  }

  for (const [key, value] of new Headers(extraHeaders).entries()) {
    headers.set(key, value);
  }

  return headers;
};

// ---------------------------------------------------------------------------
// Request helpers
// ---------------------------------------------------------------------------

export const resolveRequestCredentials = (
  optionsCredentials: RequestCredentials | undefined,
  request: SubmitRequest,
): RequestCredentials | undefined => {
  return request.transport?.credentials ?? optionsCredentials;
};

export const withRequestTransportContext = (
  request: SubmitRequest,
  context: NonNullable<SubmitRequest["transport"]>,
): SubmitRequest => {
  return withTransportPolicyContext(
    {
      ...request,
      transport: {
        ...request.transport,
        ...context,
        headers: mergeHeaders(request.transport?.headers, context.headers),
        attributes: {
          ...request.transport?.attributes,
          ...context.attributes,
        },
        policy: context.policy ?? request.transport?.policy,
      },
    },
    context.policy ?? {},
  );
};

export const ensureRequestPolicyContext = (request: SubmitRequest): SubmitRequest => {
  const policy = getTransportPolicyContext(request);
  return withTransportPolicyContext(request, policy);
};

export const withCapabilityRequirement = (
  request: SubmitRequest,
  requirement: CapabilityRequirement | undefined,
  transport: Transport,
  context: string,
): SubmitRequest => {
  if (requirement) {
    assertTransportCapabilities(transport, requirement, context);
  }
  const nextRequest = ensureRequestPolicyContext(request);
  assertPayloadWithinLimits(transport, nextRequest, context);
  return nextRequest;
};

export const normalizeRequest = (
  request: SubmitRequest,
  transport: Transport,
  context: string,
): SubmitRequest => {
  const nextRequest = ensureRequestPolicyContext(request);
  assertPayloadWithinLimits(transport, nextRequest, context);
  return nextRequest;
};

export const getTransportScope = (request: SubmitRequest, fallback: string): string => {
  return getTransportPolicyContext(request).scope || fallback;
};

export const withRequestPolicyScope = (
  request: SubmitRequest,
  scope: string,
  extras?: {
    source?: string;
    backend?: string;
    requestId?: string;
  },
): SubmitRequest => {
  return withTransportPolicyContext(request, {
    scope,
    source: extras?.source,
    backend: extras?.backend,
    requestId: extras?.requestId,
  });
};

// ---------------------------------------------------------------------------
// Error helpers
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Safety assertions
// ---------------------------------------------------------------------------

export const assertRetrySafe = (transport: Transport, allowUnsafeRetry = false): void => {
  if (!allowUnsafeRetry) {
    try {
      assertTransportCapabilities(transport, { safety: { retrySafe: true } }, "withRetry");
      return;
    } catch {
      // fall through
    }
    throw new TransportError(transportErrorMessages.retryUnsafe, {
      code: transportErrorCodes.CAPABILITY_MISMATCH,
      retryable: false,
      details: {
        capabilities: inferTransportCapabilities(transport),
      },
    });
  }
};

export const assertCacheSafe = (transport: Transport, allowUnsafeCache = false): void => {
  if (!allowUnsafeCache) {
    try {
      assertTransportCapabilities(transport, { safety: { cacheable: true } }, "withCache");
      return;
    } catch {
      // fall through
    }
    throw new TransportError(transportErrorMessages.cacheUnsafe, {
      code: transportErrorCodes.CAPABILITY_MISMATCH,
      retryable: false,
      details: {
        capabilities: inferTransportCapabilities(transport),
      },
    });
  }
};

export const assertHedgingSafe = (transport: Transport, allowUnsafeHedging = false): void => {
  if (!allowUnsafeHedging) {
    try {
      assertTransportCapabilities(
        transport,
        { safety: { hedgeSafe: true } },
        "createHedgedTransport",
      );
      return;
    } catch {
      // fall through
    }
    throw new TransportError(transportErrorMessages.hedgedUnsafe, {
      code: transportErrorCodes.CAPABILITY_MISMATCH,
      retryable: false,
      details: {
        capabilities: inferTransportCapabilities(transport),
      },
    });
  }
};

// ---------------------------------------------------------------------------
// Dedup key
// ---------------------------------------------------------------------------

export const defaultDedupKey = (request: SubmitRequest): string => {
  return JSON.stringify({
    backend: request.backend,
    serializedValues: request.serializedValues,
    reports: request.reports.map((report) => (report as Record<string, unknown>).id),
  });
};

// ---------------------------------------------------------------------------
// Response normalization
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Stream event normalization
// ---------------------------------------------------------------------------

export const normalizeStreamEvent = (event: unknown): TransportStreamEvent => {
  if (isRecord(event) && typeof event.type === "string") {
    return event as unknown as TransportStreamEvent;
  }

  return {
    type: "chunk",
    chunk: cloneValue(event),
  };
};

// ---------------------------------------------------------------------------
// Transport entry resolution
// ---------------------------------------------------------------------------

export const resolveTransportEntries = (
  transports: TransportCollection,
  factoryName: string,
): readonly TransportEntry[] => {
  const entries = Array.isArray(transports)
    ? transports.map((transport, index) => ({
        id: undefined,
        index,
        label: `transport[${index}]`,
        transport,
      }))
    : Object.entries(transports).map(([id, transport], index) => ({
        id,
        index,
        label: id,
        transport,
      }));

  if (entries.length === 0) {
    throw new TypeError(transportErrorMessages.emptyComposedTransport(factoryName));
  }

  return entries;
};

// ---------------------------------------------------------------------------
// Aggregate failure
// ---------------------------------------------------------------------------

export const createAggregateFailure = (
  message: string,
  failures: readonly {
    label: string;
    error: unknown;
  }[],
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

// ---------------------------------------------------------------------------
// Signal combination
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Delay
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Stream event meta
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Session → stream adapter
// ---------------------------------------------------------------------------

export const toSessionStreamEvent = (event: TransportSessionEvent): TransportStreamEvent | null => {
  switch (event.type) {
    case "progress":
      return event;
    case "meta":
      return event;
    case "result":
      return event;
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

// ---------------------------------------------------------------------------
// Submit-backed stream fallback
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// GraphQL value resolver (also used by tracing)
// ---------------------------------------------------------------------------

export const resolveGraphqlValue = async <TValue>(
  value: TValue | ((request: SubmitRequest) => MaybePromise<TValue>),
  request: SubmitRequest,
): Promise<TValue> => {
  return typeof value === "function"
    ? (value as (request: SubmitRequest) => MaybePromise<TValue>)(request)
    : value;
};

// ---------------------------------------------------------------------------
// SSE block parser
// ---------------------------------------------------------------------------

export const parseSseBlocks = async function* (stream: ReadableStream<Uint8Array>): AsyncIterable<{
  id?: string;
  event?: string;
  data: string;
  retry?: number;
}> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });

    while (true) {
      const separatorIndex = buffer.indexOf("\n\n");
      if (separatorIndex === -1) {
        break;
      }

      const block = buffer.slice(0, separatorIndex);
      buffer = buffer.slice(separatorIndex + 2);

      let id: string | undefined;
      let event: string | undefined;
      let retry: number | undefined;
      const dataLines: string[] = [];

      for (const rawLine of block.split(/\r?\n/)) {
        if (!rawLine || rawLine.startsWith(":")) {
          continue;
        }

        const separator = rawLine.indexOf(":");
        const field = separator === -1 ? rawLine : rawLine.slice(0, separator);
        const valueText = separator === -1 ? "" : rawLine.slice(separator + 1).trimStart();

        if (field === "id") {
          id = valueText;
        } else if (field === "event") {
          event = valueText;
        } else if (field === "retry") {
          retry = Number.parseInt(valueText, 10);
        } else if (field === "data") {
          dataLines.push(valueText);
        }
      }

      yield {
        id,
        event,
        data: dataLines.join("\n"),
        retry: Number.isFinite(retry) ? retry : undefined,
      };
    }
  }

  if (buffer.trim()) {
    yield {
      data: buffer.trim(),
    };
  }
};

// ---------------------------------------------------------------------------
// Default SSE event decoder
// ---------------------------------------------------------------------------

export const defaultDecodeSseEvent = async (event: {
  id?: string;
  event?: string;
  data: string;
  retry?: number;
}): Promise<TransportStreamEvent> => {
  let parsed: unknown = event.data;
  if (event.data) {
    try {
      parsed = JSON.parse(event.data);
    } catch {
      parsed = event.data;
    }
  }

  if (event.event === "progress" && isRecord(parsed)) {
    return {
      type: "progress",
      loaded: typeof parsed.loaded === "number" ? parsed.loaded : undefined,
      total: typeof parsed.total === "number" ? parsed.total : undefined,
      message: typeof parsed.message === "string" ? parsed.message : undefined,
      meta: {
        event: event.event,
        id: event.id,
        retry: event.retry,
      },
    };
  }

  if (event.event === "result" || (isRecord(parsed) && parsed.type === "result")) {
    return {
      type: "result",
      result: isRecord(parsed) && "result" in parsed ? parsed.result : parsed,
      meta: {
        event: event.event,
        id: event.id,
        retry: event.retry,
      },
    };
  }

  if (event.event === "error" || (isRecord(parsed) && parsed.type === "error")) {
    return {
      type: "error",
      error: isRecord(parsed) && "error" in parsed ? parsed.error : parsed,
      meta: {
        event: event.event,
        id: event.id,
        retry: event.retry,
      },
    };
  }

  if (isRecord(parsed) && typeof parsed.type === "string") {
    return parsed as unknown as TransportStreamEvent;
  }

  return {
    type: "chunk",
    chunk: parsed,
    meta: {
      event: event.event,
      id: event.id,
      retry: event.retry,
    },
  };
};

// ---------------------------------------------------------------------------
// Default body/parse/error helpers for JSON/GraphQL transports
// ---------------------------------------------------------------------------

export const defaultBody = (request: Parameters<Transport["submit"]>[0]) => ({
  [transportDefaults.requestBodyKey]: request.serializedValues,
});

export const defaultParse = async (response: Response): Promise<unknown> => {
  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
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
  if (!isRecord(payload) || typeof payload.code !== "string" || !payload.code.trim()) {
    return undefined;
  }

  return payload.code;
};

export const resolveMethod = (method: string | undefined): "POST" | "PUT" | "PATCH" | "DELETE" => {
  const normalized = (method ?? transportDefaults.method).toUpperCase();

  if (
    normalized === "POST" ||
    normalized === "PUT" ||
    normalized === "PATCH" ||
    normalized === "DELETE"
  ) {
    return normalized;
  }

  throw new TypeError(transportErrorMessages.unsupportedMethod(normalized));
};

// ---------------------------------------------------------------------------
// Secret resolver (used by withAuth)
// ---------------------------------------------------------------------------

export const resolveSecret = async (
  value: string | (() => MaybePromise<string>),
): Promise<string> => {
  return typeof value === "function" ? value() : value;
};

// ---------------------------------------------------------------------------
// Weighted transport chooser (used by routing + load balancing)
// ---------------------------------------------------------------------------

export const chooseWeightedTransport = async <TTransportId extends string>(
  request: SubmitRequest,
  transportIds: readonly TTransportId[],
  weights:
    | Partial<Record<TTransportId, number>>
    | ((request: SubmitRequest, transportId: TTransportId) => MaybePromise<number>),
  filter?: (transportId: TTransportId, request: SubmitRequest) => MaybePromise<boolean>,
): Promise<TTransportId> => {
  const candidates: { id: TTransportId; weight: number }[] = [];

  for (const transportId of transportIds) {
    if (filter && !(await filter(transportId, request))) {
      continue;
    }
    const weight =
      typeof weights === "function" ? await weights(request, transportId) : weights[transportId];
    if ((weight ?? 0) > 0) {
      candidates.push({ id: transportId, weight: weight ?? 0 });
    }
  }

  if (candidates.length === 0) {
    throw new TransportError("No eligible transport available for weighted routing.", {
      code: "NO_ELIGIBLE_TRANSPORT",
      retryable: false,
    });
  }

  const totalWeight = candidates.reduce((sum, candidate) => sum + candidate.weight, 0);
  let cursor = Math.random() * totalWeight;
  for (const candidate of candidates) {
    cursor -= candidate.weight;
    if (cursor <= 0) {
      return candidate.id;
    }
  }

  return candidates.at(-1)!.id;
};

// ---------------------------------------------------------------------------
// Fanout helpers
// ---------------------------------------------------------------------------

export const toFanoutMeta = (
  results: readonly { id: string | undefined; index: number; response: TransportResponse }[],
  failures: readonly { id: string | undefined; index: number; error: unknown }[],
): Record<string, unknown> => {
  const transportMeta = results.some((result) => result.id !== undefined)
    ? Object.fromEntries(
        results.map((result) => [result.id ?? String(result.index), result.response.meta ?? {}]),
      )
    : results.map((result) => result.response.meta ?? {});

  const meta: Record<string, unknown> = { transports: transportMeta };

  if (failures.length > 0) {
    meta.failures = failures.map((f) => ({
      id: f.id ?? String(f.index),
      error: f.error instanceof Error ? f.error.message : String(f.error),
    }));
  }

  return meta;
};

export const toFanoutRaw = (
  results: readonly { id: string | undefined; index: number; response: TransportResponse }[],
): unknown => {
  return results.some((result) => result.id !== undefined)
    ? Object.fromEntries(
        results.map((result) => [result.id ?? String(result.index), result.response.raw]),
      )
    : results.map((result) => result.response.raw);
};

export const mergeFanoutResponses = (
  results: readonly { id: string | undefined; index: number; response: TransportResponse }[],
  failures: readonly { id: string | undefined; index: number; error: unknown }[],
): TransportResponse => {
  const reports: Record<string, unknown> = {};
  const reportSources = new Map<string, string>();

  for (const result of results) {
    for (const [reportId, payload] of Object.entries(result.response.reports ?? {})) {
      const currentSource = result.id ?? `transport[${result.index}]`;
      const previousSource = reportSources.get(reportId);
      if (previousSource) {
        throw new Error(
          transportErrorMessages.duplicateFanoutReport(reportId, previousSource, currentSource),
        );
      }

      reportSources.set(reportId, currentSource);
      reports[reportId] = payload;
    }
  }

  return {
    reports,
    meta: toFanoutMeta(results, failures),
    raw: toFanoutRaw(results),
  };
};
