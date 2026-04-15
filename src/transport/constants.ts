// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

export const transportDefaults = {
  method: "POST",
  acceptHeader: "application/json",
  contentTypeHeader: "application/json",
  requestBodyKey: "inputs",
} as const;

export const transportErrorMessages = {
  missingFetch: "A fetch implementation is required to use the default transport.",
  unsupportedMethod: (method: string): string =>
    `Unsupported HTTP method "${method}" for createJsonTransport. Use POST, PUT, PATCH, or DELETE.`,
  requestFailed: (status: number, statusText: string): string =>
    `Request failed with status ${status}${statusText ? ` ${statusText}` : ""}.`,
  emptyComposedTransport: (factoryName: string): string =>
    `${factoryName} requires at least one transport.`,
  unknownComposedTransport: (
    factoryName: string,
    transportId: string,
    availableTransportIds: readonly string[],
  ): string =>
    `${factoryName} selected unknown transport "${transportId}". Available transports: ${availableTransportIds.join(", ")}.`,
  duplicateFanoutReport: (reportId: string, firstSource: string, secondSource: string): string =>
    `createFanoutTransport received report "${reportId}" from both ${firstSource} and ${secondSource}. Provide unique report ids or a custom merge implementation.`,
  fanoutFailed: (failedSources: readonly string[]): string =>
    `createFanoutTransport failed for ${failedSources.join(", ")}.`,
  fanoutEmpty: "createFanoutTransport: all transports filtered out. No submissions dispatched.",
  fallbackFailed: (failedSources: readonly string[]): string =>
    `createFallbackTransport exhausted all transports: ${failedSources.join(", ")}.`,
  emptyPipeline: "createPipelineTransport requires at least one stage.",
  pipelineAborted: (stageId: string): string =>
    `createPipelineTransport: aborted during stage "${stageId}".`,
  racingAllFailed: "createRacingTransport: all transports failed.",
  missingStream: (source: string): string => `${source} does not support streaming.`,
  retryInvalidAttempts: "withRetry: attempts must be at least 1.",
  timeoutInvalid: "withTimeout: timeout must be a positive number.",
  retryUnsafe:
    "withRetry: transport declares retrySafe=false. Pass `allowUnsafeRetry: true` to override.",
  cacheUnsafe:
    "withCache: transport declares cacheable=false. Pass `allowUnsafeCache: true` to override.",
  circuitInvalidFailureThreshold: "withCircuitBreaker: failureThreshold must be at least 1.",
  circuitInvalidResetTimeout: "withCircuitBreaker: resetTimeout must be a positive number.",
  rateLimitInvalid:
    "withRateLimit: provide at least one positive maxConcurrent or perSecond limit.",
  rateLimitQueueFull: "withRateLimit: queue limit exceeded.",
  cacheInvalidTtl: "withCache: ttl must be a positive number.",
  circuitOpen: (source: string): string => `Transport circuit is open for ${source}.`,
  hedgedUnsafe:
    "createHedgedTransport: every transport must declare retrySafe !== false or allowUnsafeHedging must be true.",
  sseInvalidEvent: "createSseTransport: failed to parse SSE event payload.",
  websocketMissing:
    "createWebSocketSessionTransport requires a WebSocket implementation in this environment.",
} as const;
