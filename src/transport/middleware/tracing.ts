// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import {
  getTransportScope,
  resolveGraphqlValue,
  withRequestPolicyScope,
  withRequestTransportContext,
} from "../internal";
import { getTransportPolicyContext } from "../policy-context";
import { withRequestTransform } from "./transform";
import type { TransportMiddleware, TransportTraceOptions } from "../types";

export const withTracing = (options: TransportTraceOptions): TransportMiddleware => {
  return withRequestTransform(async (request) => {
    const traceparent = options.traceparent
      ? await resolveGraphqlValue(options.traceparent, request)
      : undefined;
    const baggage = options.baggage
      ? await resolveGraphqlValue(options.baggage, request)
      : undefined;
    const attributes = options.attributes ? await options.attributes(request) : undefined;
    const requestId = options.requestId
      ? await resolveGraphqlValue(options.requestId, request)
      : undefined;
    const scope = options.scope ? await resolveGraphqlValue(options.scope, request) : undefined;
    const existingHeaders = new Headers(request.transport?.headers);
    const nextHeaders = new Headers(
      options.preserveExistingHeaders === false ? undefined : existingHeaders,
    );

    if (traceparent && (!options.preserveExistingHeaders || !nextHeaders.has("traceparent"))) {
      nextHeaders.set("traceparent", traceparent);
    }
    if (baggage && (!options.preserveExistingHeaders || !nextHeaders.has("baggage"))) {
      nextHeaders.set("baggage", baggage);
    }

    return withRequestPolicyScope(
      withRequestTransportContext(request, {
        headers: nextHeaders,
        attributes: {
          ...attributes,
          traceparent,
          baggage,
          requestId,
        },
      }),
      scope ?? getTransportScope(request, "transport"),
      {
        source: getTransportPolicyContext(request).source,
        backend: request.backend,
        requestId,
      },
    );
  });
};
