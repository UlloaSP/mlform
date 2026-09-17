// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { ReportFetchExecutionContext, ReportFetchExecutionResult } from "../types";
import { createAbortError } from "../errors";
import { awaitWithSubmissionAbort } from "./abort";

const unknownReportFetchError = "Unknown report fetch error.";

const throwIfAborted = (signal: AbortSignal | undefined): void => {
  if (!signal?.aborted) return;
  const reason =
    signal.reason instanceof Error ? signal.reason.message : String(signal.reason ?? "");
  throw createAbortError(reason);
};

export const executeReportFetches = async ({
  reports,
  request,
}: ReportFetchExecutionContext): Promise<ReportFetchExecutionResult> => {
  throwIfAborted(request.signal);
  const fetchableReports = reports.filter(
    (report) => report.canFetch && report.state.status === "idle",
  );

  if (fetchableReports.length === 0) {
    return {
      results: {},
      errors: {},
    };
  }

  const fetches = Promise.allSettled(
    fetchableReports.map((report) =>
      report.fetch({
        ...request,
        reportId: report.id,
        reportContext: request.reportContexts?.[report.id],
      }),
    ),
  );
  try {
    if (request.signal) await awaitWithSubmissionAbort(fetches, request.signal);
    else await fetches;
  } catch (error) {
    for (const report of fetchableReports) report.abort();
    throw error;
  }
  throwIfAborted(request.signal);

  const results: Record<string, unknown> = {};
  const errors: Record<string, string> = {};

  for (const report of fetchableReports) {
    const state = report.state;
    if (state.status === "ready") {
      results[report.id] = state.payload;
      continue;
    }

    if (state.status === "error") {
      errors[report.id] = state.error ?? unknownReportFetchError;
    }
  }

  return {
    results,
    errors,
  };
};
