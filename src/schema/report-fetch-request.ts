// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { ReportFetchRequest } from "./types/report";
import type { SubmitResult } from "./types/submit";
import { getReportContext } from "./report-context";

export const createReportFetchRequest = (
  submitResult: SubmitResult,
  options: { reportId?: string; signal?: AbortSignal } = {},
): ReportFetchRequest => ({
  reportId: options.reportId ?? "",
  backend: submitResult.backend,
  inputs: submitResult.inputs,
  displayValues: submitResult.displayValues,
  modelValues: submitResult.modelValues,
  reports: submitResult.reports,
  reportContext:
    options.reportId === undefined ? undefined : getReportContext(submitResult, options.reportId),
  reportContexts: submitResult.reportContexts,
  meta: submitResult.meta,
  raw: submitResult.raw,
  signal: options.signal,
});
