// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type {
  PrimitiveFormController,
  PrimitiveFormLifecycle,
  PrimitiveFormOperation,
  PrimitiveReportController,
} from "../controller-types";

export type FormRenderState = {
  lifecycle: PrimitiveFormLifecycle;
  operation: PrimitiveFormOperation;
  hasFormErrors: boolean;
  visibleFieldIds: string[];
  visibleReportIds: string[];
  reportStateKeys: string[];
};

const sameIds = (left: readonly string[], right: readonly string[]): boolean => {
  return left.length === right.length && left.every((value, index) => value === right[index]);
};

export const sameFormRenderState = (left: FormRenderState, right: FormRenderState): boolean => {
  return (
    left.lifecycle === right.lifecycle &&
    left.operation === right.operation &&
    left.hasFormErrors === right.hasFormErrors &&
    sameIds(left.visibleFieldIds, right.visibleFieldIds) &&
    sameIds(left.visibleReportIds, right.visibleReportIds) &&
    sameIds(left.reportStateKeys, right.reportStateKeys)
  );
};

export const selectFormRenderState = (form: PrimitiveFormController): FormRenderState => {
  const state = form.state;

  return {
    lifecycle: state.lifecycle,
    operation: state.operation,
    hasFormErrors: state.errors.form.length > 0,
    visibleFieldIds: form.fields.filter((field) => field.state.visible).map((field) => field.id),
    visibleReportIds: form.reports.map((report) => report.id),
    reportStateKeys: form.reports.map(
      (report) =>
        `${report.id}:${report.state.status}:${report.state.payload === undefined}:${report.state.error === null}`,
    ),
  };
};

export const resolveVisibleReports = (
  form: PrimitiveFormController,
  visibleReportIds: string[],
  reportPane: "auto" | "always" | "hidden",
): readonly PrimitiveReportController[] => {
  const visibleReports = visibleReportIds
    .map((reportId) => form.getReport(reportId))
    .filter((report): report is NonNullable<typeof report> => report !== undefined);
  return reportPane === "always" ? form.reports : visibleReports;
};
