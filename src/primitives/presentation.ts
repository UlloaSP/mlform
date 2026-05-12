// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type {
  ExplanationDescriptor,
  FieldDescriptor,
  PresentationRegistry,
  ReportDescriptor,
} from "@/presentation";
import type {
  ExplanationController,
  FieldController,
  FormController,
  ReportController,
} from "@/runtime";

export const fallbackFieldDescriptor = (field: FieldController): FieldDescriptor => ({
  component: "unsupported-field",
  props: { label: field.config.label ?? field.id },
});

export const fallbackReportDescriptor = (report: ReportController): ReportDescriptor => ({
  component: "unsupported-report",
  props: { label: report.config.label ?? report.id },
});

export const fallbackExplanationDescriptor = (
  explanation: ExplanationController,
): ExplanationDescriptor => ({
  component: "unsupported-explanation",
  props: { label: explanation.config.label ?? explanation.id },
});

export const resolveFieldDescriptor = (
  field: FieldController,
  presentationRegistry: PresentationRegistry | undefined,
): FieldDescriptor =>
  presentationRegistry?.getField(field.kind)?.describe(field.config, {
    fieldId: field.id,
    state: field.state,
    value: field.state.value,
  }) ?? fallbackFieldDescriptor(field);

export const resolveReportDescriptor = (
  report: ReportController,
  form: FormController,
  presentationRegistry: PresentationRegistry | undefined,
): ReportDescriptor | null => {
  const presenter = presentationRegistry?.getReport(report.kind);
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

export const resolveExplanationDescriptor = (
  explanation: ExplanationController,
  presentationRegistry: PresentationRegistry | undefined,
): ExplanationDescriptor | null => {
  const presenter = presentationRegistry?.getExplanation(explanation.kind);
  if (!presenter) {
    return null;
  }

  return presenter.describe(explanation.config, {
    explanationId: explanation.id,
    state: explanation.state,
  });
};
