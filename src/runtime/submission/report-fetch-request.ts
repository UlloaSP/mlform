// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { ReportFetchRequest, SubmitResult } from "../types";

export const createReportFetchRequest = (
  submitResult: SubmitResult,
  options: {
    reportId?: string;
    signal?: AbortSignal;
  } = {},
): ReportFetchRequest => ({
  reportId: options.reportId ?? "",
  backend: submitResult.backend,
  values: submitResult.values,
  fieldValues: submitResult.fieldValues,
  serializedValues: submitResult.serializedValues,
  serializedFieldValues: submitResult.serializedFieldValues,
  reports: submitResult.reports,
  meta: submitResult.meta,
  raw: submitResult.raw,
  signal: options.signal,
});
