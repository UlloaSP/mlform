// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { SubmitResult } from "../types";
import { cloneValue } from "../values";
import { toSubmissionReportStates, type SubmissionReport } from "./reports";

export const createSubmissionResult = (
  reports: readonly SubmissionReport[],
  baseResult: Omit<SubmitResult, "reportStates">,
  nextReportStates: Map<string, SubmitResult["reportStates"][string]>,
): SubmitResult => {
  return {
    ...baseResult,
    reportStates: toSubmissionReportStates(reports, nextReportStates),
  };
};

export const cloneSubmissionResult = (
  reports: readonly SubmissionReport[],
  result: SubmitResult,
): SubmitResult => {
  const reportStates = Object.fromEntries(
    reports.map((report) => {
      const state = result.reportStates[report.id];
      return [report.id, state ? report.cloneState(state) : state];
    }),
  ) as SubmitResult["reportStates"];

  return {
    backend: result.backend,
    values: cloneValue(result.values),
    fieldValues: cloneValue(result.fieldValues),
    serializedValues: cloneValue(result.serializedValues),
    serializedFieldValues: cloneValue(result.serializedFieldValues),
    reports: cloneValue(result.reports),
    reportStates,
    meta: cloneValue(result.meta),
    raw: cloneValue(result.raw),
  };
};
