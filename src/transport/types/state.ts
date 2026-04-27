// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { MaybePromise, SubmitRequest } from "./core";

export interface TransportCacheEntry {
  expiresAt: number;
  response: unknown;
}

export interface TransportCacheStore {
  get(scope: string, key: string): MaybePromise<TransportCacheEntry | undefined>;
  set(scope: string, key: string, entry: TransportCacheEntry): MaybePromise<void>;
  delete(scope: string, key: string): MaybePromise<void>;
  evictExpired?(scope: string, now: number): MaybePromise<void>;
  keys?(scope: string): MaybePromise<readonly string[]>;
}

export interface CircuitBreakerStateSnapshot {
  state: "closed" | "open" | "half-open";
  failureCount: number;
  openUntil: number;
  halfOpenActive: number;
}

export interface CircuitBreakerSharedState {
  get(scope: string): MaybePromise<CircuitBreakerStateSnapshot | undefined>;
  compareAndSet?(
    scope: string,
    expected: CircuitBreakerStateSnapshot | undefined,
    next: CircuitBreakerStateSnapshot,
  ): MaybePromise<boolean>;
  set(scope: string, snapshot: CircuitBreakerStateSnapshot): MaybePromise<void>;
}

export interface SharedRateLimiterLease {
  release: () => MaybePromise<void>;
}

export interface RateLimitLeaseRequest {
  request: SubmitRequest;
  maxConcurrent?: number;
  perSecond?: number;
  queueLimit?: number;
}

export interface SharedRateLimiter {
  acquire: (scope: string, lease: RateLimitLeaseRequest) => MaybePromise<SharedRateLimiterLease>;
}

export interface TransportHealthSnapshot {
  consecutiveFailures: number;
  lastFailureAt?: number;
  lastSuccessAt?: number;
  averageLatencyMs?: number;
}

export interface TransportHealthState<TTransportId extends string = string> {
  getSnapshot: (
    scope: string,
    transportId: TTransportId,
  ) => MaybePromise<TransportHealthSnapshot | undefined>;
  recordSuccess: (
    scope: string,
    transportId: TTransportId,
    durationMs: number,
  ) => MaybePromise<void>;
  recordFailure: (scope: string, transportId: TTransportId, error: unknown) => MaybePromise<void>;
}
