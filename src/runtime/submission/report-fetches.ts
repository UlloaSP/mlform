// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { ReportFetchExecutionContext, ReportFetchExecutionResult } from "../types";

const unknownReportFetchError = "Unknown report fetch error.";

export const executeReportFetches = async ({
  reports,
  request,
}: ReportFetchExecutionContext): Promise<ReportFetchExecutionResult> => {
  const fetchableReports = reports.filter(
    (report) => report.canFetch && report.state.status === "idle",
  );

  if (fetchableReports.length === 0) {
    return {
      results: {},
      errors: {},
    };
  }

  await Promise.allSettled(
    fetchableReports.map((report) =>
      report.fetch({
        ...request,
        reportId: report.id,
      }),
    ),
  );

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
