// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { cloneValue } from "../clone";
import type { CircuitBreakerSharedState } from "../types";

type MemoryCircuitState = {
  state: "closed" | "open" | "half-open";
  failureCount: number;
  openUntil: number;
  halfOpenActive: number;
};

export const createMemoryCircuitBreakerState = (): CircuitBreakerSharedState => {
  const states = new Map<string, MemoryCircuitState>();

  return {
    async get(scope) {
      return states.get(scope);
    },
    async compareAndSet(scope, expected, next) {
      const current = states.get(scope);
      if (JSON.stringify(current) !== JSON.stringify(expected)) {
        return false;
      }
      states.set(scope, cloneValue(next));
      return true;
    },
    async set(scope, snapshot) {
      states.set(scope, cloneValue(snapshot));
    },
  };
};
