// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { cloneCapabilities, inferTransportCapabilities } from "../capabilities";
import { createTransport, getTransportScope, normalizeRequest, resolveStream } from "../internal";
import type { TransportMetricsOptions, TransportMiddleware } from "../types";

export const withMetrics = (options: TransportMetricsOptions): TransportMiddleware => {
  return (transport) =>
    createTransport(
      async (request) => {
        request = normalizeRequest(request, transport, "withMetrics");
        const scope = getTransportScope(request, "transport");
        options.emit({ kind: "request-start", request, scope });
        const start = Date.now();

        try {
          const response = await transport.submit(request);
          options.emit({
            kind: "request-success",
            request,
            scope,
            durationMs: Date.now() - start,
            meta: { response },
          });
          return response;
        } catch (error) {
          options.emit({
            kind: "request-error",
            request,
            scope,
            durationMs: Date.now() - start,
            error,
          });
          throw error;
        }
      },
      transport.stream
        ? async function* (request) {
            request = normalizeRequest(request, transport, "withMetrics.stream");
            const scope = getTransportScope(request, "transport");
            options.emit({ kind: "request-start", request, scope });
            const start = Date.now();
            try {
              const stream = await resolveStream(transport, request);
              for await (const event of stream) {
                options.emit({
                  kind: "stream-event",
                  request,
                  scope,
                  meta: { event },
                });
                if (event.type === "result") {
                  options.emit({
                    kind: "request-success",
                    request,
                    scope,
                    durationMs: Date.now() - start,
                    meta: { response: event.result },
                  });
                }
                yield event;
              }
            } catch (error) {
              options.emit({
                kind: "request-error",
                request,
                scope,
                durationMs: Date.now() - start,
                error,
              });
              throw error;
            }
          }
        : undefined,
      {
        openSession: transport.openSession
          ? async (request) => {
              request = normalizeRequest(request, transport, "withMetrics.session");
              const scope = getTransportScope(request, "transport");
              options.emit({ kind: "session-open", request, scope });
              const session = await transport.openSession!(request);
              return {
                send: session.send,
                receive: session.receive,
                close: async (reason?: string) => {
                  options.emit({
                    kind: "session-close",
                    request,
                    scope,
                    meta: reason ? { reason } : undefined,
                  });
                  await session.close(reason);
                },
                capabilities: session.capabilities,
              };
            }
          : undefined,
        capabilities: cloneCapabilities(inferTransportCapabilities(transport)),
      },
    );
};
