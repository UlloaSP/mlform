// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { mergeTransportCapabilities, normalizeTransportCapabilities } from "../capabilities";
import {
  createTransport,
  normalizeRequest,
  normalizeStreamEvent,
  withCapabilityRequirement,
} from "../internal";
import { createSessionTransport } from "../state/session";
import type {
  GrpcSessionTransportOptions,
  GrpcStreamTransportOptions,
  GrpcTransportOptions,
  GrpcUnaryTransportOptions,
  Transport,
} from "../types";

export const createGrpcUnaryTransport = (options: GrpcUnaryTransportOptions): Transport => {
  if (!options.unary) {
    throw new TypeError("createGrpcUnaryTransport requires a unary handler.");
  }

  const transport = createTransport(
    async (request) =>
      options.unary!(normalizeRequest(request, transport, "createGrpcUnaryTransport")),
    undefined,
    {
      capabilities: mergeTransportCapabilities(
        normalizeTransportCapabilities(options.capabilities),
        normalizeTransportCapabilities(undefined, {
          modes: { submit: true, stream: false, session: false },
          auth: {
            kinds: ["transport-context", "custom", "bearer", "api-key"],
          },
        }),
      ),
    },
  );
  return transport;
};

export const createGrpcStreamTransport = (options: GrpcStreamTransportOptions): Transport => {
  const transport = createTransport(
    async (request) => {
      request = normalizeRequest(request, transport, "createGrpcStreamTransport");
      let result: unknown;
      for await (const event of await options.stream(request)) {
        const normalized = normalizeStreamEvent(event);
        if (normalized.type === "result") {
          result = normalized.result;
        } else if (normalized.type === "error") {
          throw normalized.error;
        }
      }
      return result;
    },
    async function* (request) {
      request = withCapabilityRequirement(
        request,
        { modes: { stream: true } },
        transport,
        "createGrpcStreamTransport.stream",
      );
      const stream = await options.stream(request);
      for await (const event of stream) {
        yield normalizeStreamEvent(event);
      }
    },
    {
      capabilities: mergeTransportCapabilities(
        normalizeTransportCapabilities(options.capabilities),
        normalizeTransportCapabilities(undefined, {
          modes: { submit: true, stream: true, session: false },
          auth: {
            kinds: ["transport-context", "custom", "bearer", "api-key"],
          },
          delivery: {
            mode: "stream",
            consistency: "best-effort",
            backpressure: "consumer-pull",
          },
        }),
      ),
    },
  );
  return transport;
};

export const createGrpcSessionTransport = (options: GrpcSessionTransportOptions): Transport => {
  return createSessionTransport({
    openSession: options.session,
    capabilities: mergeTransportCapabilities(
      normalizeTransportCapabilities(options.capabilities),
      normalizeTransportCapabilities(undefined, {
        modes: { submit: true, stream: true, session: true },
        auth: {
          kinds: ["transport-context", "custom", "bearer", "api-key"],
        },
        delivery: {
          mode: "session",
          consistency: "best-effort",
          backpressure: "bounded-buffer",
        },
      }),
    ),
  });
};

export const createGrpcTransport = (options: GrpcTransportOptions): Transport => {
  if (!options.unary && !options.stream && !options.session) {
    throw new TypeError("createGrpcTransport requires at least unary, stream, or session.");
  }

  const transport = createTransport(
    options.unary
      ? async (request) =>
          options.unary!(normalizeRequest(request, transport, "createGrpcTransport"))
      : async (request) => {
          request = normalizeRequest(request, transport, "createGrpcTransport");
          let result: unknown = null;
          if (!options.stream) {
            return result;
          }
          for await (const event of await options.stream(request)) {
            const normalized = normalizeStreamEvent(event);
            if (normalized.type === "result") {
              result = normalized.result;
            } else if (normalized.type === "error") {
              throw normalized.error;
            }
          }
          return result;
        },
    options.stream
      ? async function* (request) {
          request = withCapabilityRequirement(
            request,
            { modes: { stream: true } },
            transport,
            "createGrpcTransport.stream",
          );
          const stream = await options.stream!(request);
          for await (const event of stream) {
            yield normalizeStreamEvent(event);
          }
        }
      : undefined,
    {
      openSession: options.session,
      capabilities: mergeTransportCapabilities(
        normalizeTransportCapabilities(options.capabilities),
        normalizeTransportCapabilities(undefined, {
          auth: {
            kinds: ["transport-context", "custom", "bearer", "api-key"],
          },
          modes: {
            submit: true,
            stream: Boolean(options.stream),
            session: Boolean(options.session),
          },
          delivery: {
            mode: options.session ? "session" : options.stream ? "stream" : "request-response",
            consistency: "best-effort",
            backpressure: options.session
              ? "bounded-buffer"
              : options.stream
                ? "consumer-pull"
                : "none",
          },
        }),
      ),
    },
  );
  return transport;
};
