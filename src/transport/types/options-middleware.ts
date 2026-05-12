// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { MaybePromise, SubmitRequest, Transport, TransportPolicyContext } from "./core";
import type { TransportStreamEvent } from "./events";
import type { CircuitBreakerSharedState, SharedRateLimiter, TransportCacheStore } from "./state";

export interface SessionTransportOptions {
  submit?: Transport["submit"];
  stream?: Transport["stream"];
  openSession: NonNullable<Transport["openSession"]>;
  capabilities?: import("./capabilities").TransportCapabilities;
}

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
