// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

export * from "./types";
export { TransportError, transportErrorCodes, type TransportErrorCode } from "./errors";
export { transportDefaults, transportErrorMessages } from "./constants";
export {
  assertPayloadWithinLimits,
  assertTransportCapabilities,
  cloneCapabilities,
  inferTransportCapabilities,
  mergeTransportCapabilities,
  normalizeTransportCapabilities,
} from "./capabilities";
export { getTransportPolicyContext, withTransportPolicyContext } from "./policy-context";
export { createTransportRequestRunner, extractErrorMessage } from "./request-runner";
export type { TransportRequestOutcome, TransportRequestRunner } from "./request-runner";
export * from "./protocols";
export * from "./middleware";
export * from "./composition";
export * from "./state";
