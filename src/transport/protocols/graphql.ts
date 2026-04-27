// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { normalizeTransportCapabilities } from "../capabilities";
import { transportDefaults, transportErrorMessages } from "../constants";
import { TransportError, transportErrorCodes } from "../errors";
import {
  createTransport,
  defaultParse,
  isRecord,
  mergeHeaders,
  normalizeRequest,
  resolveErrorCode,
  resolveErrorMessage,
  resolveGraphqlValue,
  resolveRequestCredentials,
} from "../internal";
import type { GraphqlTransportOptions, Transport } from "../types";

export const createGraphqlTransport = (options: GraphqlTransportOptions): Transport => {
  const source = options.source ?? String(options.endpoint);
  const transport = createTransport(
    async (request) => {
      request = normalizeRequest(request, transport, "createGraphqlTransport");
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
      if (!headers.has("accept")) {
        headers.set("accept", transportDefaults.acceptHeader);
      }
      if (!headers.has("content-type")) {
        headers.set("content-type", transportDefaults.contentTypeHeader);
      }

      const query = await resolveGraphqlValue(options.query, request);
      const operationName = options.operationName
        ? await resolveGraphqlValue(options.operationName, request)
        : undefined;
      const variables = options.variables
        ? await options.variables(request)
        : request.serializedValues;

      const response = await fetchImpl(String(options.endpoint), {
        method: "POST",
        headers,
        credentials: resolveRequestCredentials(options.credentials, request),
        body: JSON.stringify({
          query,
          variables,
          operationName,
        }),
        signal: request.signal,
      });

      const parse = options.parse ?? defaultParse;
      const payload = await parse(response);

      if (!response.ok) {
        throw new TransportError(
          resolveErrorMessage(response.status, response.statusText, payload),
          {
            source,
            status: response.status,
            code:
              resolveErrorCode(payload) ??
              (response.status >= 500 ? transportErrorCodes.UPSTREAM_5XX : undefined),
            retryable: response.status >= 500,
            response: payload,
          },
        );
      }

      if (isRecord(payload) && Array.isArray(payload.errors) && payload.errors.length > 0) {
        throw new TransportError(
          String(
            payload.errors
              .map((error) =>
                isRecord(error) && typeof error.message === "string"
                  ? error.message
                  : String(error),
              )
              .join(", "),
          ),
          {
            source,
            code: transportErrorCodes.GRAPHQL_ERROR,
            retryable: false,
            response: payload,
          },
        );
      }

      if (options.resolveResult) {
        return options.resolveResult(payload, request);
      }

      const resultPath = options.resultPath ?? "data";
      if (resultPath === "data") {
        return isRecord(payload) && "data" in payload ? payload.data : payload;
      }

      const segments = resultPath.split(".").slice(1);
      let current: unknown = isRecord(payload) ? payload.data : undefined;
      for (const segment of segments) {
        if (!isRecord(current) || !(segment in current)) {
          current = undefined;
          break;
        }
        current = current[segment];
      }
      return current;
    },
    undefined,
    {
      capabilities: normalizeTransportCapabilities(undefined, {
        modes: {
          submit: true,
          stream: false,
          session: false,
        },
        safety: {
          idempotent: false,
          retrySafe: false,
          cacheable: true,
          hedgeSafe: false,
        },
        auth: {
          kinds: ["none", "api-key", "bearer", "transport-context", "custom"],
        },
        delivery: {
          mode: "request-response",
          consistency: "best-effort",
          backpressure: "none",
        },
      }),
    },
  );
  return transport;
};
