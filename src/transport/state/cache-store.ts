// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { cloneValue } from "../clone";
import type { TransportCacheEntry, TransportCacheStore } from "../types";

export const createMemoryTransportCacheStore = (): TransportCacheStore => {
  const cache = new Map<string, Map<string, TransportCacheEntry>>();
  const resolveScope = (scope: string) => {
    const bucket = cache.get(scope) ?? new Map<string, TransportCacheEntry>();
    cache.set(scope, bucket);
    return bucket;
  };

  return {
    async get(scope, key) {
      return resolveScope(scope).get(key);
    },
    async set(scope, key, entry) {
      resolveScope(scope).set(key, cloneValue(entry));
    },
    async delete(scope, key) {
      resolveScope(scope).delete(key);
    },
    async evictExpired(scope, now) {
      const bucket = resolveScope(scope);
      for (const [key, entry] of bucket.entries()) {
        if (entry.expiresAt <= now) {
          bucket.delete(key);
        }
      }
    },
    async keys(scope) {
      return [...resolveScope(scope).keys()];
    },
  };
};
