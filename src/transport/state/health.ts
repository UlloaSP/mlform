// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { TransportHealthSnapshot, TransportHealthState } from "../types";

export const createMemoryTransportHealthState = <
  TTransportId extends string = string,
>(): TransportHealthState<TTransportId> => {
  const snapshots = new Map<string, Map<TTransportId, TransportHealthSnapshot>>();
  const resolveScope = (scope: string) => {
    const bucket = snapshots.get(scope) ?? new Map<TTransportId, TransportHealthSnapshot>();
    snapshots.set(scope, bucket);
    return bucket;
  };

  return {
    async getSnapshot(scope, transportId) {
      return resolveScope(scope).get(transportId);
    },
    async recordSuccess(scope, transportId, durationMs) {
      const bucket = resolveScope(scope);
      const current = bucket.get(transportId);
      bucket.set(transportId, {
        consecutiveFailures: 0,
        lastFailureAt: current?.lastFailureAt,
        lastSuccessAt: Date.now(),
        averageLatencyMs:
          current?.averageLatencyMs === undefined
            ? durationMs
            : (current.averageLatencyMs + durationMs) / 2,
      });
    },
    async recordFailure(scope, transportId) {
      const bucket = resolveScope(scope);
      const current = bucket.get(transportId);
      bucket.set(transportId, {
        consecutiveFailures: (current?.consecutiveFailures ?? 0) + 1,
        lastFailureAt: Date.now(),
        lastSuccessAt: current?.lastSuccessAt,
        averageLatencyMs: current?.averageLatencyMs,
      });
    },
  };
};
