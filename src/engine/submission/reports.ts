// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { EngineError } from "../errors";
import type { ReportStateSnapshot, SubmitResult } from "../types";

export type SubmissionReport = {
  readonly id: string;
  cloneState(state: ReportStateSnapshot): ReportStateSnapshot;
  prepareState(result: SubmitResult): Promise<ReportStateSnapshot>;
  commitState(state: ReportStateSnapshot): void;
};

export const prepareReportStates = async (
  reports: readonly SubmissionReport[],
  baseResult: SubmitResult,
): Promise<Map<string, ReportStateSnapshot>> => {
  const nextReportStates = new Map<string, ReportStateSnapshot>();

  await Promise.all(
    reports.map(async (report) => {
      nextReportStates.set(report.id, await report.prepareState(baseResult));
    }),
  );

  return nextReportStates;
};

export const commitReportStates = (
  reports: readonly SubmissionReport[],
  nextReportStates: Map<string, ReportStateSnapshot>,
): void => {
  for (const report of reports) {
    const nextState = nextReportStates.get(report.id);
    if (!nextState) {
      throw new EngineError(`Prepared report state missing for "${report.id}".`);
    }
    report.commitState(nextState);
  }
};

export const toSubmissionReportStates = (
  reports: readonly SubmissionReport[],
  nextReportStates: Map<string, ReportStateSnapshot>,
): Record<string, ReportStateSnapshot> => {
  return Object.fromEntries(
    reports.map((report) => {
      const nextState = nextReportStates.get(report.id);
      if (!nextState) {
        throw new EngineError(`Prepared report state missing for "${report.id}".`);
      }

      return [report.id, report.cloneState(nextState)];
    }),
  ) as Record<string, ReportStateSnapshot>;
};
