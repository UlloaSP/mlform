// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import {
  cloneCapabilities,
  inferTransportCapabilities,
  mergeTransportCapabilities,
  normalizeTransportCapabilities,
} from "../capabilities";
import { cloneValue } from "../clone";
import { transportErrorMessages } from "../constants";
import { assertCacheSafe, createTransport, getTransportScope, normalizeRequest } from "../internal";
import { createMemoryTransportCacheStore } from "../state/cache-store";
import type { CacheOptions, TransportMiddleware } from "../types";

export const withCache = (options: CacheOptions): TransportMiddleware => {
  if (options.ttl <= 0 || !Number.isFinite(options.ttl)) {
    throw new TypeError(transportErrorMessages.cacheInvalidTtl);
  }

  const cacheStore = options.store ?? createMemoryTransportCacheStore();

  return (transport) => {
    assertCacheSafe(transport, options.allowUnsafeCache);

    return createTransport(
      async (request) => {
        request = normalizeRequest(request, transport, "withCache");
        const scope = options.scope ?? getTransportScope(request, "transport");
        const key = options.key(request);
        const cached = await cacheStore.get(scope, key);
        if (cached && cached.expiresAt > Date.now()) {
          return cloneValue(cached.response);
        }

        if (cached) {
          await cacheStore.delete(scope, key);
        }

        const response = await transport.submit(request);
        if ((options.shouldCache?.(response, request) ?? true) === true) {
          await cacheStore.set(scope, key, {
            expiresAt: Date.now() + options.ttl,
            response: cloneValue(response),
          });

          if (cacheStore.evictExpired) {
            await cacheStore.evictExpired(scope, Date.now());
          }

          if (options.maxEntries && cacheStore.keys) {
            const keys = await cacheStore.keys(scope);
            if (keys.length > options.maxEntries) {
              const oldestKey = keys[0];
              if (oldestKey) {
                await cacheStore.delete(scope, oldestKey);
              }
            }
          }
        }

        return cloneValue(response);
      },
      transport.stream,
      {
        openSession: transport.openSession,
        capabilities: mergeTransportCapabilities(
          cloneCapabilities(inferTransportCapabilities(transport)),
          normalizeTransportCapabilities(undefined, {
            safety: {
              cacheable: true,
              idempotent: inferTransportCapabilities(transport).safety.idempotent,
              retrySafe: inferTransportCapabilities(transport).safety.retrySafe,
              hedgeSafe: inferTransportCapabilities(transport).safety.hedgeSafe,
            },
          }),
        ),
      },
    );
  };
};
