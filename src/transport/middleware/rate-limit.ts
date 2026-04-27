// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { cloneCapabilities, inferTransportCapabilities } from "../capabilities";
import { transportErrorMessages } from "../constants";
import { createTransport, getTransportScope, normalizeRequest, resolveStream } from "../internal";
import { createMemorySharedRateLimiter } from "../state/rate-limiter";
import type { RateLimitOptions, TransportMiddleware } from "../types";

export const withRateLimit = (options: RateLimitOptions): TransportMiddleware => {
  if (
    (!options.maxConcurrent || options.maxConcurrent < 1) &&
    (!options.perSecond || options.perSecond < 1)
  ) {
    throw new TypeError(transportErrorMessages.rateLimitInvalid);
  }

  const limiter = options.limiter ?? createMemorySharedRateLimiter();
  return (transport) =>
    createTransport(
      async (request) => {
        request = normalizeRequest(request, transport, "withRateLimit");
        const scope = options.scope ?? options.key ?? getTransportScope(request, "transport");
        const lease = await limiter.acquire(scope, {
          request,
          maxConcurrent: options.maxConcurrent,
          perSecond: options.perSecond,
          queueLimit: options.queueLimit,
        });
        try {
          return await transport.submit(request);
        } finally {
          await lease.release();
        }
      },
      transport.stream
        ? async function* (request) {
            request = normalizeRequest(request, transport, "withRateLimit.stream");
            const scope = options.scope ?? options.key ?? getTransportScope(request, "transport");
            const lease = await limiter.acquire(scope, {
              request,
              maxConcurrent: options.maxConcurrent,
              perSecond: options.perSecond,
              queueLimit: options.queueLimit,
            });
            try {
              const stream = await resolveStream(transport, request);
              for await (const event of stream) {
                yield event;
              }
            } finally {
              await lease.release();
            }
          }
        : undefined,
      {
        openSession: transport.openSession,
        capabilities: cloneCapabilities(inferTransportCapabilities(transport)),
      },
    );
};
