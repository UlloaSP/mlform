// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { TransportCapabilities } from "./capabilities";
import type {
  MaybePromise,
  SubmitRequest,
  Transport,
  TransportPolicyContext,
  TransportResponse,
} from "./core";
import type { TransportStreamEvent } from "./events";
import type { TransportSession, TransportSessionMessage } from "./session";
import type { CapabilityRequirement } from "./capabilities";
import type {
  CircuitBreakerSharedState,
  SharedRateLimiter,
  TransportCacheStore,
  TransportHealthState,
} from "./state";
import type { TransportCollection } from "./middleware";

// ---------------------------------------------------------------------------
// JSON transport
// ---------------------------------------------------------------------------

export type JsonTransportMethod = "POST" | "PUT" | "PATCH" | "DELETE";

export interface JsonTransportOptions {
  endpoint: string | URL;
  source?: string;
  fetch?: typeof globalThis.fetch;
  method?: JsonTransportMethod;
  headers?: HeadersInit | (() => MaybePromise<HeadersInit>);
  credentials?: RequestCredentials;
  body?: (request: SubmitRequest) => BodyInit | null | undefined;
  parse?: (response: Response) => Promise<unknown>;
  stream?: (
    response: Response,
    request: SubmitRequest,
  ) => MaybePromise<AsyncIterable<TransportStreamEvent>>;
}

export interface GraphqlTransportOptions {
  endpoint: string | URL;
  source?: string;
  fetch?: typeof globalThis.fetch;
  query: string | ((request: SubmitRequest) => MaybePromise<string>);
  operationName?: string | ((request: SubmitRequest) => MaybePromise<string | undefined>);
  variables?: (request: SubmitRequest) => MaybePromise<Record<string, unknown>>;
  headers?: HeadersInit | (() => MaybePromise<HeadersInit>);
  credentials?: RequestCredentials;
  parse?: (response: Response) => Promise<unknown>;
  resultPath?: "data" | `data.${string}`;
  resolveResult?: (payload: unknown, request: SubmitRequest) => MaybePromise<unknown>;
}

export interface SseTransportOptions {
  endpoint: string | URL;
  source?: string;
  fetch?: typeof globalThis.fetch;
  method?: "POST" | "PUT" | "PATCH";
  headers?: HeadersInit | (() => MaybePromise<HeadersInit>);
  credentials?: RequestCredentials;
  body?: (request: SubmitRequest) => BodyInit | null | undefined;
  decodeEvent?: (
    event: {
      id?: string;
      event?: string;
      data: string;
      retry?: number;
    },
    request: SubmitRequest,
  ) => MaybePromise<TransportStreamEvent>;
  resultEvent?:
    | string
    | ((event: { id?: string; event?: string; data: string; retry?: number }) => boolean);
  maxPayloadBytes?: number;
}

export interface WebSocketSessionTransportOptions {
  url: string | URL | ((request: SubmitRequest) => MaybePromise<string | URL>);
  source?: string;
  WebSocket?: typeof globalThis.WebSocket;
  protocols?: string | string[] | ((request: SubmitRequest) => MaybePromise<string | string[]>);
  serializeMessage?: (message: unknown) => string | ArrayBuffer | Blob | Uint8Array;
  deserializeMessage?: (data: string | ArrayBuffer | Blob) => MaybePromise<unknown>;
  sessionInit?:
    | TransportSessionMessage
    | ((request: SubmitRequest) => MaybePromise<TransportSessionMessage | undefined>);
  closeTimeoutMs?: number;
  maxBufferedMessages?: number;
  bufferOverflow?: "close" | "drop-oldest" | "drop-newest" | "error";
}

export interface GrpcUnaryTransportOptions {
  source?: string;
  unary?: (request: SubmitRequest) => MaybePromise<unknown>;
  capabilities?: TransportCapabilities;
}

export interface GrpcStreamTransportOptions {
  source?: string;
  stream: (request: SubmitRequest) => MaybePromise<AsyncIterable<TransportStreamEvent>>;
  capabilities?: TransportCapabilities;
}

export interface GrpcSessionTransportOptions {
  source?: string;
  session: (request: SubmitRequest) => MaybePromise<TransportSession>;
  capabilities?: TransportCapabilities;
}

export interface GrpcTransportOptions {
  source?: string;
  unary?: (request: SubmitRequest) => MaybePromise<unknown>;
  stream?: (request: SubmitRequest) => MaybePromise<AsyncIterable<TransportStreamEvent>>;
  session?: (request: SubmitRequest) => MaybePromise<TransportSession>;
  capabilities?: TransportCapabilities;
}

// ---------------------------------------------------------------------------
// Session transport
// ---------------------------------------------------------------------------

export interface SessionTransportOptions {
  submit?: Transport["submit"];
  stream?: Transport["stream"];
  openSession: NonNullable<Transport["openSession"]>;
  capabilities?: TransportCapabilities;
}

// ---------------------------------------------------------------------------
// Routing transport
// ---------------------------------------------------------------------------

export interface RoutingTransportOptions<TTransportId extends string = string> {
  transports: Record<TTransportId, Transport>;
  requiredCapabilities?: CapabilityRequirement;
  selectTransport: (
    request: SubmitRequest,
    context: {
      transportIds: readonly TTransportId[];
    },
  ) => MaybePromise<TTransportId>;
}

export interface WeightedRoutingTransportOptions<TTransportId extends string = string> {
  transports: Record<TTransportId, Transport>;
  requiredCapabilities?: CapabilityRequirement;
  weights:
    | Partial<Record<TTransportId, number>>
    | ((request: SubmitRequest, transportId: TTransportId) => MaybePromise<number>);
  filter?: (transportId: TTransportId, request: SubmitRequest) => MaybePromise<boolean>;
}

// ---------------------------------------------------------------------------
// Fanout transport
// ---------------------------------------------------------------------------

export interface FanoutTransportResult<TTransportId extends string = string> {
  id: TTransportId | undefined;
  index: number;
  response: TransportResponse;
}

export interface FanoutTransportFailure<TTransportId extends string = string> {
  id: TTransportId | undefined;
  index: number;
  error: unknown;
}

export interface FanoutTransportOptions<TTransportId extends string = string> {
  transports: TransportCollection<TTransportId>;
  requiredCapabilities?: CapabilityRequirement;
  filter?: (transportId: string, request: SubmitRequest) => MaybePromise<boolean>;
  transformRequest?: (transportId: string, request: SubmitRequest) => MaybePromise<SubmitRequest>;
  failurePolicy?: "fail-all" | "partial-success";
  abortPolicy?: "wait-all" | "abort-pending-on-first-failure" | "abort-pending-on-first-success";
  merge?: (context: {
    request: SubmitRequest;
    results: readonly FanoutTransportResult<TTransportId>[];
    failures: readonly FanoutTransportFailure<TTransportId>[];
  }) => MaybePromise<unknown>;
}

// ---------------------------------------------------------------------------
// Fallback transport
// ---------------------------------------------------------------------------

export interface FallbackTransportFailure<TTransportId extends string = string> {
  id: TTransportId | undefined;
  index: number;
  error: unknown;
}

export interface FallbackTransportOptions<TTransportId extends string = string> {
  transports: TransportCollection<TTransportId>;
  shouldFallback?: (
    error: unknown,
    context: {
      request: SubmitRequest;
      id: TTransportId | undefined;
      index: number;
      failures: readonly FallbackTransportFailure<TTransportId>[];
    },
  ) => MaybePromise<boolean>;
}

// ---------------------------------------------------------------------------
// Pipeline transport
// ---------------------------------------------------------------------------

export interface PipelineStage {
  id?: string;
  transport: Transport;
  mapToNext?: (response: unknown, originalRequest: SubmitRequest) => MaybePromise<SubmitRequest>;
  nextStageRequirements?: CapabilityRequirement;
}

export interface PipelineTransportOptions {
  stages: readonly PipelineStage[];
}

// ---------------------------------------------------------------------------
// Racing transport
// ---------------------------------------------------------------------------

export interface RacingTransportOptions {
  transports: TransportCollection;
}

export interface HedgedTransportOptions<TTransportId extends string = string> {
  transports: Record<TTransportId, Transport>;
  hedgeDelayMs: number;
  maxAttempts?: number;
  allowUnsafeHedging?: boolean;
}

export interface QuorumFanoutTransportOptions<
  TTransportId extends string = string,
> extends FanoutTransportOptions<TTransportId> {
  quorum: number;
}

// ---------------------------------------------------------------------------
// Load balancing transport
// ---------------------------------------------------------------------------

export interface LoadBalancingTransportOptions<TTransportId extends string = string> {
  transports: Record<TTransportId, Transport>;
  requiredCapabilities?: CapabilityRequirement;
  strategy?: "round-robin" | "least-loaded" | "random" | "weighted" | "health-weighted";
  weights?:
    | Partial<Record<TTransportId, number>>
    | ((request: SubmitRequest, transportId: TTransportId) => MaybePromise<number>);
  healthState?: TransportHealthState<TTransportId>;
}

// ---------------------------------------------------------------------------
// Middleware options
// ---------------------------------------------------------------------------

export interface RetryOptions {
  attempts: number;
  backoff?: "exponential" | "linear" | number[] | ((attempt: number) => number);
  baseDelay?: number;
  maxDelay?: number;
  jitter?: boolean;
  allowUnsafeRetry?: boolean;
  retryOn?: (error: unknown, attempt: number) => boolean;
}

export interface ApiKeyAuthOptions {
  type: "api-key";
  key: string | (() => MaybePromise<string>);
  header?: string;
  prefix?: string;
}

export interface BearerAuthOptions {
  type: "bearer";
  token: string | (() => MaybePromise<string>);
  header?: string;
  prefix?: string;
}

export interface CustomAuthOptions {
  type: "custom";
  apply: (request: SubmitRequest) => MaybePromise<SubmitRequest>;
}

export interface TransportContextAuthOptions {
  type: "transport-context";
  context:
    | NonNullable<SubmitRequest["transport"]>
    | (() => MaybePromise<NonNullable<SubmitRequest["transport"]>>);
}

export type AuthOptions =
  | ApiKeyAuthOptions
  | BearerAuthOptions
  | CustomAuthOptions
  | TransportContextAuthOptions;

export interface CircuitBreakerOptions {
  failureThreshold: number;
  resetTimeout: number;
  halfOpenMaxRequests?: number;
  key?: string;
  scope?: string;
  sharedState?: CircuitBreakerSharedState;
  tripOn?: (error: unknown) => boolean;
  onStateChange?: (state: "closed" | "open" | "half-open") => void;
}

export interface RateLimitOptions {
  maxConcurrent?: number;
  perSecond?: number;
  queueLimit?: number;
  key?: string;
  scope?: string;
  limiter?: SharedRateLimiter;
}

export interface DedupOptions {
  key?: (request: SubmitRequest) => string;
}

export interface CacheOptions {
  key: (request: SubmitRequest) => string;
  ttl: number;
  maxEntries?: number;
  scope?: string;
  store?: TransportCacheStore;
  allowUnsafeCache?: boolean;
  shouldCache?: (response: unknown, request: SubmitRequest) => boolean;
}

export interface TransportTraceOptions {
  traceparent?: string | ((request: SubmitRequest) => MaybePromise<string | undefined>);
  baggage?: string | ((request: SubmitRequest) => MaybePromise<string | undefined>);
  attributes?: (request: SubmitRequest) => MaybePromise<Record<string, unknown> | undefined>;
  preserveExistingHeaders?: boolean;
  requestId?: string | ((request: SubmitRequest) => MaybePromise<string | undefined>);
  scope?: string | ((request: SubmitRequest) => MaybePromise<string | undefined>);
}

export interface TransportTelemetryEvent {
  kind:
    | "request-start"
    | "request-success"
    | "request-error"
    | "stream-event"
    | "session-open"
    | "session-close"
    | "capability-reject"
    | "policy-block";
  source?: string;
  scope?: string;
  durationMs?: number;
  error?: unknown;
  request: SubmitRequest;
  meta?: Record<string, unknown>;
}

export interface TransportMetricsOptions {
  emit(event: TransportTelemetryEvent): void;
}

export interface TransportLogOptions {
  onRequest?: (request: SubmitRequest) => void;
  onResponse?: (response: unknown, request: SubmitRequest, durationMs: number) => void;
  onError?: (error: unknown, request: SubmitRequest, durationMs: number) => void;
  onStreamEvent?: (event: TransportStreamEvent, request: SubmitRequest) => void;
}

export type TransportContextPolicy = TransportPolicyContext;
