// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { mergeTransportCapabilities, normalizeTransportCapabilities } from "../capabilities";
import { TransportError, transportErrorCodes } from "../errors";
import { createTransport, toSessionStreamEvent } from "../internal";
import type { SessionTransportOptions, SubmitRequest, Transport } from "../types";

export const createSessionTransport = (options: SessionTransportOptions): Transport => {
  const submit =
    options.submit ??
    (async (request) => {
      const session = await options.openSession(request);
      try {
        for await (const event of await session.receive()) {
          if (event.type === "result") {
            return event.result;
          }
          if (event.type === "error") {
            throw event.error;
          }
        }
        throw new TransportError("createSessionTransport: session closed without a result.", {
          code: transportErrorCodes.SESSION_RESULT_MISSING,
          retryable: false,
        });
      } finally {
        await session.close("submit-complete");
      }
    });

  const stream =
    options.stream ??
    async function* (request: SubmitRequest) {
      const session = await options.openSession(request);
      try {
        yield {
          type: "meta" as const,
          meta: {
            sessionOpen: true,
            bufferedMessages: session.capabilities?.bufferedMessages,
          },
        };
        for await (const event of await session.receive()) {
          const streamEvent = toSessionStreamEvent(event);
          if (streamEvent) {
            yield streamEvent;
          }
        }
      } finally {
        yield {
          type: "meta" as const,
          meta: {
            sessionClosing: true,
          },
        };
        await session.close("stream-complete");
      }
    };

  return createTransport(submit, stream, {
    openSession: options.openSession,
    capabilities: mergeTransportCapabilities(
      normalizeTransportCapabilities(options.capabilities),
      normalizeTransportCapabilities(undefined, {
        modes: {
          submit: true,
          stream: true,
          session: true,
        },
        delivery: {
          mode: "session",
          consistency: "unknown",
          backpressure: "bounded-buffer",
        },
      }),
    ),
  });
};
