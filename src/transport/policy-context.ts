// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { SubmitRequest, SubmitRequestTransportContext, TransportPolicyContext } from "./types";

const POLICY_ATTRIBUTE_KEY = "__policy";

const cloneAttributes = (
  attributes: Record<string, unknown> | undefined,
): Record<string, unknown> => ({
  ...attributes,
});

export const getTransportPolicyContext = (request: SubmitRequest): TransportPolicyContext => {
  const attributePolicy = request.transport?.attributes?.[POLICY_ATTRIBUTE_KEY];
  const explicitPolicy = request.transport?.policy;
  const policy = explicitPolicy ??
    (typeof attributePolicy === "object" && attributePolicy !== null
      ? (attributePolicy as TransportPolicyContext)
      : undefined) ?? {
      scope: request.backend ?? "transport",
      backend: request.backend,
    };

  return {
    scope: policy.scope || request.backend || "transport",
    source: policy.source,
    backend: policy.backend ?? request.backend,
    requestId: policy.requestId,
  };
};

export const withTransportPolicyContext = (
  request: SubmitRequest,
  policy: Partial<TransportPolicyContext>,
): SubmitRequest => {
  const current = getTransportPolicyContext(request);
  const next: TransportPolicyContext = {
    ...current,
    ...policy,
    scope: policy.scope ?? current.scope,
    backend: policy.backend ?? current.backend ?? request.backend,
  };
  const transport: SubmitRequestTransportContext = {
    ...request.transport,
    policy: next,
    attributes: {
      ...cloneAttributes(request.transport?.attributes),
      [POLICY_ATTRIBUTE_KEY]: next,
    },
  };

  return {
    ...request,
    transport,
  };
};
