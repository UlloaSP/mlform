// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { cloneCapabilities, inferTransportCapabilities } from "../capabilities";
import { createTransport, defaultDedupKey } from "../internal";
import type { DedupOptions, TransportMiddleware } from "../types";

export const withDedup = (options: DedupOptions = {}): TransportMiddleware => {
  const keyFn = options.key ?? defaultDedupKey;
  const inFlight = new Map<string, Promise<unknown>>();

  return (transport) =>
    createTransport(
      async (request) => {
        const key = keyFn(request);
        const existing = inFlight.get(key);
        if (existing) {
          return existing;
        }

        const pending = transport.submit(request).finally(() => {
          inFlight.delete(key);
        });
        inFlight.set(key, pending);
        return pending;
      },
      transport.stream,
      {
        openSession: transport.openSession,
        capabilities: cloneCapabilities(inferTransportCapabilities(transport)),
      },
    );
};
