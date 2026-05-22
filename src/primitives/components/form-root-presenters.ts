// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type {
  FieldDescriptor,
  PrimitiveDescriptorRegistry,
  ReportDescriptor,
} from "../descriptors";
import type { PrimitiveFormController, PrimitiveReportController } from "../controller-types";
import { resolveFieldDescriptor, resolveReportDescriptor } from "../descriptor-resolution";

export type PresentedField = {
  controller: NonNullable<ReturnType<PrimitiveFormController["getField"]>>;
  descriptor: FieldDescriptor;
};

export type PresentedReport = {
  controller: PrimitiveReportController;
  descriptor: ReportDescriptor | null;
};

export const presentVisibleFields = (
  form: PrimitiveFormController,
  fieldIds: readonly string[],
  descriptorRegistry: PrimitiveDescriptorRegistry | undefined,
): PresentedField[] =>
  fieldIds
    .map((fieldId) => form.getField(fieldId))
    .filter((field): field is NonNullable<typeof field> => field !== undefined)
    .map((controller) => ({
      controller,
      descriptor: resolveFieldDescriptor(controller, descriptorRegistry),
    }));

export const presentVisibleReports = (
  form: PrimitiveFormController,
  reportIds: readonly string[],
  reportPane: "auto" | "always" | "hidden",
  descriptorRegistry: PrimitiveDescriptorRegistry | undefined,
): PresentedReport[] => {
  const reports =
    reportPane === "always"
      ? form.reports
      : reportIds
          .map((reportId) => form.getReport(reportId))
          .filter((report): report is NonNullable<typeof report> => report !== undefined);

  return reports
    .map((controller) => ({
      controller,
      descriptor: resolveReportDescriptor(controller, form, descriptorRegistry),
    }))
    .filter((report) => report.descriptor !== null);
};
