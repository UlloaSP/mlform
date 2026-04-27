// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { normalizeTransportCapabilities } from "../capabilities";
import { transportDefaults, transportErrorMessages } from "../constants";
import { TransportError, transportErrorCodes } from "../errors";
import {
  createTransport,
  defaultBody,
  defaultDecodeSseEvent,
  mergeHeaders,
  normalizeRequest,
  parseSseBlocks,
  resolveRequestCredentials,
  withCapabilityRequirement,
} from "../internal";
import type { SseTransportOptions, SubmitRequest, Transport, TransportStreamEvent } from "../types";

export const createSseTransport = (options: SseTransportOptions): Transport => {
  const source = options.source ?? String(options.endpoint);
  const method = options.method ?? "POST";
  const runSseStream = async function* (request: SubmitRequest) {
    request = normalizeRequest(request, transport, "createSseTransport");
    const fetchImpl = options.fetch ?? globalThis.fetch;
    if (typeof fetchImpl !== "function") {
      throw new TransportError(transportErrorMessages.missingFetch, {
        source,
        code: "FETCH_MISSING",
        retryable: false,
      });
    }

    const resolvedHeaders =
      typeof options.headers === "function" ? await options.headers() : options.headers;
    const headers = mergeHeaders(resolvedHeaders, request.transport?.headers);
    headers.set("accept", "text/event-stream");
    if (!headers.has("content-type")) {
      headers.set("content-type", transportDefaults.contentTypeHeader);
    }

    const body =
      typeof options.body === "function"
        ? options.body(request)
        : JSON.stringify(defaultBody(request));

    const response = await fetchImpl(String(options.endpoint), {
      method,
      headers,
      credentials: resolveRequestCredentials(options.credentials, request),
      body,
      signal: request.signal,
    });

    if (!response.ok) {
      throw new TransportError(
        transportErrorMessages.requestFailed(response.status, response.statusText),
        {
          source,
          status: response.status,
          code: response.status >= 500 ? transportErrorCodes.UPSTREAM_5XX : undefined,
          retryable: response.status >= 500,
        },
      );
    }

    if (!response.body) {
      throw new TransportError(transportErrorMessages.missingStream(source), {
        source,
        code: "STREAM_BODY_MISSING",
        retryable: false,
      });
    }

    const decodeEvent = options.decodeEvent ?? defaultDecodeSseEvent;
    for await (const event of parseSseBlocks(response.body)) {
      try {
        const decoded = await decodeEvent(event, request);
        yield decoded;
        if (
          options.resultEvent &&
          ((typeof options.resultEvent === "string" && event.event === options.resultEvent) ||
            (typeof options.resultEvent === "function" && options.resultEvent(event)))
        ) {
          yield {
            type: "result",
            result:
              decoded.type === "chunk"
                ? decoded.chunk
                : decoded.type === "meta"
                  ? decoded.meta
                  : decoded.type === "result"
                    ? decoded.result
                    : decoded,
            meta: {
              event: event.event,
            },
          } satisfies TransportStreamEvent;
        }
      } catch (error) {
        throw new TransportError(transportErrorMessages.sseInvalidEvent, {
          source,
          cause: error,
          code: transportErrorCodes.PARSE_FAILED,
          retryable: false,
        });
      }
    }
  };

  const transport = createTransport(
    async (request) => {
      request = normalizeRequest(request, transport, "createSseTransport.submit");
      let lastResult: unknown;
      let sawResult = false;
      for await (const event of runSseStream(request)) {
        if (event.type === "result") {
          lastResult = event.result;
          sawResult = true;
        } else if (event.type === "error") {
          throw event.error;
        }
      }

      if (!sawResult) {
        throw new TransportError("createSseTransport: stream completed without a result event.", {
          source,
          code: transportErrorCodes.SESSION_RESULT_MISSING,
          retryable: false,
        });
      }

      return lastResult;
    },
    async function* (request) {
      request = withCapabilityRequirement(
        request,
        { modes: { stream: true } },
        transport,
        "createSseTransport.stream",
      );
      for await (const event of runSseStream(request)) {
        yield event;
      }
    },
    {
      capabilities: normalizeTransportCapabilities(undefined, {
        modes: {
          submit: Boolean(options.resultEvent),
          stream: true,
          session: false,
        },
        safety: {
          idempotent: method === "PUT",
          retrySafe: method === "PUT",
          cacheable: false,
          hedgeSafe: method === "PUT",
        },
        limits: {
          maxPayloadBytes: options.maxPayloadBytes,
        },
        auth: {
          kinds: ["none", "api-key", "bearer", "transport-context", "custom"],
        },
        delivery: {
          mode: "stream",
          consistency: "best-effort",
          backpressure: "consumer-pull",
        },
      }),
    },
  );
  return transport;
};
