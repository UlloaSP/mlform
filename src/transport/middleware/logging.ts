// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { cloneCapabilities, inferTransportCapabilities } from "../capabilities";
import { createTransport, resolveStream } from "../internal";
import type { TransportLogOptions, TransportMiddleware } from "../types";

export const withLogging = (options: TransportLogOptions): TransportMiddleware => {
  return (transport) =>
    createTransport(
      async (request) => {
        options.onRequest?.(request);
        const start = Date.now();

        try {
          const response = await transport.submit(request);
          options.onResponse?.(response, request, Date.now() - start);
          return response;
        } catch (error) {
          options.onError?.(error, request, Date.now() - start);
          throw error;
        }
      },
      transport.stream
        ? async function* (request) {
            options.onRequest?.(request);
            const start = Date.now();
            try {
              const stream = await resolveStream(transport, request);
              for await (const event of stream) {
                options.onStreamEvent?.(event, request);
                if (event.type === "result") {
                  options.onResponse?.(event.result, request, Date.now() - start);
                }
                yield event;
              }
            } catch (error) {
              options.onError?.(error, request, Date.now() - start);
              throw error;
            }
          }
        : undefined,
      {
        openSession: transport.openSession
          ? async (request) => {
              options.onRequest?.(request);
              return transport.openSession!(request);
            }
          : undefined,
        capabilities: cloneCapabilities(inferTransportCapabilities(transport)),
      },
    );
};
