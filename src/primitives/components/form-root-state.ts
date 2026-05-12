// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type {
  ExplanationController,
  FormController,
  FormStatus,
  ReportController,
} from "@/runtime";

export type FormRenderState = {
  status: FormStatus;
  submitCount: number;
  hasFormErrors: boolean;
  hasLastResult: boolean;
  submissionLoaded?: number;
  submissionTotal?: number;
  submissionMessage?: string;
  submissionSessionMessageCount?: number;
  visibleFieldIds: string[];
  visibleReportIds: string[];
  explanationIds: string[];
  reportStateKeys: string[];
  explanationStateKeys: string[];
};

const sameIds = (left: readonly string[], right: readonly string[]): boolean => {
  return left.length === right.length && left.every((value, index) => value === right[index]);
};

export const sameFormRenderState = (left: FormRenderState, right: FormRenderState): boolean => {
  return (
    left.status === right.status &&
    left.submitCount === right.submitCount &&
    left.hasFormErrors === right.hasFormErrors &&
    left.hasLastResult === right.hasLastResult &&
    left.submissionLoaded === right.submissionLoaded &&
    left.submissionTotal === right.submissionTotal &&
    left.submissionMessage === right.submissionMessage &&
    left.submissionSessionMessageCount === right.submissionSessionMessageCount &&
    sameIds(left.visibleFieldIds, right.visibleFieldIds) &&
    sameIds(left.visibleReportIds, right.visibleReportIds) &&
    sameIds(left.explanationIds, right.explanationIds) &&
    sameIds(left.reportStateKeys, right.reportStateKeys) &&
    sameIds(left.explanationStateKeys, right.explanationStateKeys)
  );
};

export const selectFormRenderState = (form: FormController): FormRenderState => {
  const state = form.state;

  return {
    status: state.status,
    submitCount: state.submitCount,
    hasFormErrors: state.errors.form.length > 0,
    hasLastResult: state.lastResult !== null,
    submissionLoaded: state.submissionProgress?.loaded,
    submissionTotal: state.submissionProgress?.total,
    submissionMessage: state.submissionProgress?.message,
    submissionSessionMessageCount: state.submissionProgress?.sessionMessageCount,
    visibleFieldIds: form.fields.filter((field) => field.state.visible).map((field) => field.id),
    visibleReportIds: form.reports.map((report) => report.id),
    explanationIds:
      state.lastResult !== null
        ? form.explanations.map((explanation: ExplanationController) => explanation.id)
        : [],
    reportStateKeys: form.reports.map(
      (report) =>
        `${report.id}:${report.state.status}:${report.state.payload === undefined}:${report.state.error === null}`,
    ),
    explanationStateKeys: form.explanations.map(
      (explanation) =>
        `${explanation.id}:${explanation.state.status}:${explanation.state.result === undefined}:${explanation.state.error === null}`,
    ),
  };
};

export const resolveVisibleReports = (
  form: FormController,
  visibleReportIds: string[],
  reportPane: "auto" | "always" | "hidden",
): readonly ReportController[] => {
  const visibleReports = visibleReportIds
    .map((reportId) => form.getReport(reportId))
    .filter((report): report is NonNullable<typeof report> => report !== undefined);
  return reportPane === "always" ? form.reports : visibleReports;
};
