// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { ReportResult } from "@/schema";
import type { TransportResponse } from "../types";
import { isRecord } from "../utils";

const invalidReportResult = (index: number, detail: string): never => {
  throw new Error(`Invalid report result at index ${index}: ${detail}.`);
};

const normalizeReportResult = (value: unknown, index: number): ReportResult => {
  if (!isRecord(value)) return invalidReportResult(index, "expected an object");
  if (typeof value.backend !== "string" || value.backend.length === 0) {
    invalidReportResult(index, '"backend" must be a non-empty string');
  }
  if (typeof value.mappedTo !== "string" && typeof value.mappedTo !== "number") {
    invalidReportResult(index, '"mappedTo" must be a string or number');
  }
  if (value.context !== undefined && !isRecord(value.context)) {
    invalidReportResult(index, '"context" must be an object');
  }

  if (value.status === "ready") {
    if (!("payload" in value)) invalidReportResult(index, '"ready" requires "payload"');
    return value as unknown as ReportResult;
  }
  if (value.status === "pending") {
    if ("payload" in value) invalidReportResult(index, '"pending" cannot contain "payload"');
    return value as unknown as ReportResult;
  }
  if (value.status === "skipped") {
    if ("payload" in value) invalidReportResult(index, '"skipped" cannot contain "payload"');
    if (value.reason !== undefined && typeof value.reason !== "string") {
      invalidReportResult(index, '"reason" must be a string');
    }
    return value as unknown as ReportResult;
  }
  return invalidReportResult(index, '"status" must be "pending", "ready", or "skipped"');
};

export const normalizeTransportResponse = (response: unknown): TransportResponse => {
  if (!isRecord(response)) return { raw: response };
  if (response.reports !== undefined && !Array.isArray(response.reports)) {
    throw new Error('Invalid transport response: "reports" must be an array.');
  }

  const reports = response.reports?.map(normalizeReportResult);
  const meta = isRecord(response.meta) ? response.meta : undefined;
  const raw = "raw" in response ? response.raw : response;
  return { reports, meta, raw };
};
