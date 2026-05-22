// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { FieldDescriptor, PrimitiveDescriptorRegistry, ReportDescriptor } from "./descriptors";
import type {
  PrimitiveFieldController,
  PrimitiveFormController,
  PrimitiveReportController,
} from "./controller-types";

export const fallbackFieldDescriptor = (field: PrimitiveFieldController): FieldDescriptor => ({
  component: "unsupported-field",
  props: { label: field.config.label ?? field.id },
});

export const fallbackReportDescriptor = (report: PrimitiveReportController): ReportDescriptor => ({
  component: "unsupported-report",
  props: { label: report.config.label ?? report.id },
});

export const resolveFieldDescriptor = (
  field: PrimitiveFieldController,
  descriptorRegistry: PrimitiveDescriptorRegistry | undefined,
): FieldDescriptor =>
  descriptorRegistry?.getField(field.kind)?.describe(field.config, {
    fieldId: field.id,
    state: field.state,
    value: field.state.value,
  }) ?? fallbackFieldDescriptor(field);

export const resolveReportDescriptor = (
  report: PrimitiveReportController,
  form: PrimitiveFormController,
  descriptorRegistry: PrimitiveDescriptorRegistry | undefined,
): ReportDescriptor | null => {
  const presenter = descriptorRegistry?.getReport(report.kind);
  if (!presenter) {
    return null;
  }

  return presenter.describe(report.config, {
    reportId: report.id,
    state: report.state,
    payload: report.state.payload,
    result: form.state.lastResult,
  });
};
