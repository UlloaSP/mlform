// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

export const kitTransportDefaults = {
  method: "POST",
  acceptHeader: "application/json",
  contentTypeHeader: "application/json",
  requestBodyKey: "inputs",
} as const;

export const kitErrorMessages = {
  missingFetch: "A fetch implementation is required to use the default kit transport.",
  missingTransport: "mountForm requires either `transport` or `endpoint`.",
  conflictingTransport:
    "mountForm received conflicting transport options. Provide exactly one transport strategy: transport or endpoint.",
  invalidDesignSystemSnapshot: "replaceDesignSystem requires an explicit mode, theme, and recipe.",
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
  fallbackFailed: (failedSources: readonly string[]): string =>
    `createFallbackTransport exhausted all transports: ${failedSources.join(", ")}.`,
} as const;
