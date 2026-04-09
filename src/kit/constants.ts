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
  missingTransport: "mountForm requires either a transport or an endpoint.",
  requestFailed: (status: number, statusText: string): string =>
    `Request failed with status ${status}${statusText ? ` ${statusText}` : ""}.`,
} as const;
