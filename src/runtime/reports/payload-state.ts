// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { extractErrorMessage } from "@/transport";
import type { NormalizedReportConfig, ReportDefinition, ReportStateSnapshot } from "../types";
import { cloneValue } from "../values";

const cloneReportPayload = (
  definition: ReportDefinition,
  config: NormalizedReportConfig,
  payload: unknown,
): unknown => {
  if (payload === undefined) return undefined;
  return definition.clonePayload ? definition.clonePayload(payload, config) : cloneValue(payload);
};

export const cloneReportStateSnapshot = (
  definition: ReportDefinition,
  config: NormalizedReportConfig,
  state: ReportStateSnapshot,
): ReportStateSnapshot => ({
  payload: cloneReportPayload(definition, config, state.payload),
  error: state.error,
  status: state.status,
});

export const preparePayloadState = (
  definition: ReportDefinition,
  config: NormalizedReportConfig,
  rawPayload: unknown,
  errorFactory: (message: string, error: unknown) => Error,
): ReportStateSnapshot => {
  if (rawPayload === undefined || !definition.payloadSchema) {
    return {
      payload: cloneReportPayload(definition, config, rawPayload),
      error: null,
      status: rawPayload === undefined ? "idle" : "ready",
    };
  }

  try {
    const payload = definition.payloadSchema.parse(rawPayload);
    return {
      payload: cloneReportPayload(definition, config, payload),
      error: null,
      status: "ready",
    };
  } catch (error) {
    const message = extractErrorMessage(error);
    if (definition.payloadValidationPolicy === "fail-submit") {
      throw errorFactory(message, error);
    }

    return { payload: undefined, error: message, status: "error" };
  }
};
