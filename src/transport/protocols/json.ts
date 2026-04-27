// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { normalizeTransportCapabilities } from "../capabilities";
import { transportDefaults, transportErrorMessages } from "../constants";
import { TransportError, transportErrorCodes } from "../errors";
import {
  createTransport,
  isAbortError,
  normalizeRequest,
  resolveErrorCode,
  resolveErrorMessage,
  resolveMethod,
  resolveRequestCredentials,
  toTransportError,
  mergeHeaders,
  defaultBody,
  defaultParse,
  withCapabilityRequirement,
} from "../internal";
import type { JsonTransportOptions, Transport } from "../types";

export const createJsonTransport = (options: JsonTransportOptions): Transport => {
  const method = resolveMethod(options.method);
  const source = options.source ?? String(options.endpoint);
  const streamHandler = options.stream;
  const transport = createTransport(
    async (request) => {
      request = normalizeRequest(request, transport, "createJsonTransport");
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
      const body =
        typeof options.body === "function"
          ? options.body(request)
          : JSON.stringify(defaultBody(request));

      if (!headers.has("accept")) {
        headers.set("accept", transportDefaults.acceptHeader);
      }
      if (typeof options.body !== "function" && !headers.has("content-type")) {
        headers.set("content-type", transportDefaults.contentTypeHeader);
      }

      let response: Response;
      try {
        response = await fetchImpl(String(options.endpoint), {
          method,
          headers,
          credentials: resolveRequestCredentials(options.credentials, request),
          body,
          signal: request.signal,
        });
      } catch (error) {
        throw toTransportError(error, {
          source,
          code: isAbortError(error) ? transportErrorCodes.ABORTED : "TRANSPORT_REQUEST_FAILED",
          retryable: !isAbortError(error),
        });
      }

      const parse = options.parse ?? defaultParse;

      if (!response.ok) {
        let payload: unknown = null;

        try {
          payload = await parse(response);
        } catch {
          payload = null;
        }

        throw new TransportError(
          resolveErrorMessage(response.status, response.statusText, payload),
          {
            source,
            status: response.status,
            code:
              resolveErrorCode(payload) ??
              (response.status >= 500 ? transportErrorCodes.UPSTREAM_5XX : undefined),
            retryable: response.status >= 500 || response.status === 429,
            response: payload,
          },
        );
      }

      try {
        return await parse(response);
      } catch (error) {
        throw toTransportError(error, {
          source,
          code: transportErrorCodes.PARSE_FAILED,
          retryable: false,
        });
      }
    },
    streamHandler
      ? async (request) => {
          request = withCapabilityRequirement(
            request,
            { modes: { stream: true } },
            transport,
            "createJsonTransport.stream",
          );
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
          const body =
            typeof options.body === "function"
              ? options.body(request)
              : JSON.stringify(defaultBody(request));

          if (!headers.has("accept")) {
            headers.set("accept", transportDefaults.acceptHeader);
          }
          if (typeof options.body !== "function" && !headers.has("content-type")) {
            headers.set("content-type", transportDefaults.contentTypeHeader);
          }

          let response: Response;
          try {
            response = await fetchImpl(String(options.endpoint), {
              method,
              headers,
              credentials: resolveRequestCredentials(options.credentials, request),
              body,
              signal: request.signal,
            });
          } catch (error) {
            throw toTransportError(error, {
              source,
              code: isAbortError(error) ? transportErrorCodes.ABORTED : "TRANSPORT_REQUEST_FAILED",
              retryable: !isAbortError(error),
            });
          }

          if (!response.ok) {
            const parse = options.parse ?? defaultParse;
            let payload: unknown = null;
            try {
              payload = await parse(response);
            } catch {
              payload = null;
            }

            throw new TransportError(
              resolveErrorMessage(response.status, response.statusText, payload),
              {
                source,
                status: response.status,
                code:
                  resolveErrorCode(payload) ??
                  (response.status >= 500 ? transportErrorCodes.UPSTREAM_5XX : undefined),
                retryable: response.status >= 500 || response.status === 429,
                response: payload,
              },
            );
          }

          return streamHandler(response, request);
        }
      : undefined,
    {
      capabilities: normalizeTransportCapabilities(undefined, {
        modes: {
          submit: true,
          stream: Boolean(streamHandler),
          session: false,
        },
        safety: {
          idempotent: method === "PUT" || method === "DELETE",
          retrySafe: method === "PUT" || method === "DELETE",
          cacheable: false,
          hedgeSafe: method === "PUT" || method === "DELETE",
        },
        auth: {
          kinds: ["none", "api-key", "bearer", "transport-context", "custom"],
        },
        delivery: {
          mode: streamHandler ? "stream" : "request-response",
          consistency: "best-effort",
          backpressure: "consumer-pull",
        },
      }),
    },
  );
  return transport;
};
