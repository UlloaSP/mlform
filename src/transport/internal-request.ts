// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { assertPayloadWithinLimits, assertTransportCapabilities } from "./capabilities";
import { transportDefaults, transportErrorMessages } from "./constants";
import type { CapabilityRequirement, MaybePromise, SubmitRequest, Transport } from "./types";
import { getTransportPolicyContext, withTransportPolicyContext } from "./policy-context";

export const mergeHeaders = (
  baseHeaders: HeadersInit | undefined,
  extraHeaders: HeadersInit | undefined,
): Headers => {
  const headers = new Headers(baseHeaders);
  if (!extraHeaders) {
    return headers;
  }

  for (const [key, value] of new Headers(extraHeaders).entries()) {
    headers.set(key, value);
  }

  return headers;
};

export const resolveRequestCredentials = (
  optionsCredentials: RequestCredentials | undefined,
  request: SubmitRequest,
): RequestCredentials | undefined => {
  return request.transport?.credentials ?? optionsCredentials;
};

export const withRequestTransportContext = (
  request: SubmitRequest,
  context: NonNullable<SubmitRequest["transport"]>,
): SubmitRequest => {
  return withTransportPolicyContext(
    {
      ...request,
      transport: {
        ...request.transport,
        ...context,
        headers: mergeHeaders(request.transport?.headers, context.headers),
        attributes: {
          ...request.transport?.attributes,
          ...context.attributes,
        },
        policy: context.policy ?? request.transport?.policy,
      },
    },
    context.policy ?? {},
  );
};

export const ensureRequestPolicyContext = (request: SubmitRequest): SubmitRequest => {
  return withTransportPolicyContext(request, getTransportPolicyContext(request));
};

export const withCapabilityRequirement = (
  request: SubmitRequest,
  requirement: CapabilityRequirement | undefined,
  transport: Transport,
  context: string,
): SubmitRequest => {
  if (requirement) {
    assertTransportCapabilities(transport, requirement, context);
  }
  const nextRequest = ensureRequestPolicyContext(request);
  assertPayloadWithinLimits(transport, nextRequest, context);
  return nextRequest;
};

export const normalizeRequest = (
  request: SubmitRequest,
  transport: Transport,
  context: string,
): SubmitRequest => {
  const nextRequest = ensureRequestPolicyContext(request);
  assertPayloadWithinLimits(transport, nextRequest, context);
  return nextRequest;
};

export const getTransportScope = (request: SubmitRequest, fallback: string): string => {
  return getTransportPolicyContext(request).scope || fallback;
};

export const withRequestPolicyScope = (
  request: SubmitRequest,
  scope: string,
  extras?: { source?: string; backend?: string; requestId?: string },
): SubmitRequest => {
  return withTransportPolicyContext(request, {
    scope,
    source: extras?.source,
    backend: extras?.backend,
    requestId: extras?.requestId,
  });
};

export const defaultDedupKey = (request: SubmitRequest): string => {
  return JSON.stringify({
    backend: request.backend,
    serializedValues: request.serializedValues,
    reports: request.reports.map((report) => (report as Record<string, unknown>).id),
  });
};

export const resolveGraphqlValue = async <TValue>(
  value: TValue | ((request: SubmitRequest) => MaybePromise<TValue>),
  request: SubmitRequest,
): Promise<TValue> => {
  return typeof value === "function"
    ? (value as (request: SubmitRequest) => MaybePromise<TValue>)(request)
    : value;
};

export const defaultBody = (request: Parameters<Transport["submit"]>[0]) => ({
  [transportDefaults.requestBodyKey]: request.serializedValues,
});

export const resolveMethod = (method: string | undefined): "POST" | "PUT" | "PATCH" | "DELETE" => {
  const normalized = (method ?? transportDefaults.method).toUpperCase();

  if (
    normalized === "POST" ||
    normalized === "PUT" ||
    normalized === "PATCH" ||
    normalized === "DELETE"
  ) {
    return normalized;
  }

  throw new TypeError(transportErrorMessages.unsupportedMethod(normalized));
};

export const resolveSecret = async (
  value: string | (() => MaybePromise<string>),
): Promise<string> => {
  return typeof value === "function" ? value() : value;
};

export const resolveTransportEntries = (
  transports: import("./types").TransportCollection,
  factoryName: string,
): readonly import("./internal-core").TransportEntry[] => {
  const entries = Array.isArray(transports)
    ? transports.map((transport, index) => ({
        id: undefined,
        index,
        label: `transport[${index}]`,
        transport,
      }))
    : Object.entries(transports).map(([id, transport], index) => ({
        id,
        index,
        label: id,
        transport,
      }));

  if (entries.length === 0) {
    throw new TypeError(transportErrorMessages.emptyComposedTransport(factoryName));
  }

  return entries;
};
