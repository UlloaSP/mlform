// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { cloneCapabilities, inferTransportCapabilities } from "../capabilities";
import { createTransport, resolveStream } from "../internal";
import type {
  MaybePromise,
  SubmitRequest,
  TransportMiddleware,
  TransportStreamEvent,
} from "../types";

export const withRequestTransform = (
  transform: (request: SubmitRequest) => MaybePromise<SubmitRequest>,
): TransportMiddleware => {
  return (transport) =>
    createTransport(
      async (request) => {
        const transformed = await transform(request);
        return transport.submit(transformed);
      },
      transport.stream
        ? async function* (request) {
            const transformed = await transform(request);
            const stream = await resolveStream(transport, transformed);
            for await (const event of stream) {
              yield event;
            }
          }
        : undefined,
      {
        openSession: transport.openSession
          ? async (request) => transport.openSession!(await transform(request))
          : undefined,
        capabilities: cloneCapabilities(inferTransportCapabilities(transport)),
      },
    );
};

export const withResponseTransform = (
  transform: (response: unknown, request: SubmitRequest) => MaybePromise<unknown>,
): TransportMiddleware => {
  return (transport) =>
    createTransport(
      async (request) => {
        const response = await transport.submit(request);
        return transform(response, request);
      },
      transport.stream
        ? async function* (request) {
            const stream = await resolveStream(transport, request);
            for await (const event of stream) {
              if (event.type === "result") {
                yield {
                  type: "result",
                  result: await transform(event.result, request),
                } satisfies TransportStreamEvent;
                continue;
              }

              yield event;
            }
          }
        : undefined,
      {
        openSession: transport.openSession,
        capabilities: cloneCapabilities(inferTransportCapabilities(transport)),
      },
    );
};
