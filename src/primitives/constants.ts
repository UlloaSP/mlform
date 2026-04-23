// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { FormStatus, ReportStatus } from "@/engine";

export const primitiveTagNames = {
  form: "mlf-form",
  formErrors: "mlf-form-errors",
  submitButton: "mlf-submit-button",
  unsupportedComponent: "mlf-unsupported-component",
  fieldFrame: "mlf-field-frame",
  reportFrame: "mlf-report-frame",
  explanationPanel: "mlf-explanation-panel",
  declarativeField: "mlf-declarative-field",
  declarativeReport: "mlf-declarative-report",
  declarativeExplanation: "mlf-declarative-explanation",
  textField: "mlf-text-field",
  numberField: "mlf-number-field",
  booleanField: "mlf-boolean-field",
  categoryField: "mlf-category-field",
  dateField: "mlf-date-field",
  seriesField: "mlf-series-field",
  classifierReport: "mlf-classifier-report",
  regressorReport: "mlf-regressor-report",
  longTextField: "mlf-long-text-field",
  singleChoiceField: "mlf-single-choice-field",
  multiChoiceField: "mlf-multi-choice-field",
  ratingField: "mlf-rating-field",
} as const;

export const primitiveEventNames = {
  submitRequest: "mlf-submit-request",
  submitStart: "mlf-submit-start",
  submitSuccess: "mlf-submit-success",
  submitAbort: "mlf-submit-abort",
  submitError: "mlf-submit-error",
} as const;

const primitiveLabelKeys = {
  form: "form",
  reports: "reports",
  submit: "submit",
  validating: "validating",
  submitting: "submitting",
} as const;

export const primitiveDefaultLabels: Readonly<Record<keyof typeof primitiveLabelKeys, string>> = {
  form: "Inputs",
  reports: "Reports",
  submit: "Submit",
  validating: "Validating...",
  submitting: "Submitting...",
};

export interface PrimitiveText {
  formEyebrow: string;
  reportEyebrow: string;
  formErrorsTitle: string;
  helpActionLabel: string;
  helpActionGlyph: string;
  categoryPlaceholder: string;
  unsupportedMapping: (role: string, component: string) => string;
  classifierEmpty: string;
  classifierAriaLabel: string;
  classifierUnknownPrediction: string;
  classifierClassLabel: (index: number) => string;
  regressorEmpty: string;
  regressorAriaLabel: string;
  regressorExecutionTime: (value: string) => string;
  explanationLabel: string;
  explanationAriaLabel: string;
  explanationLoadingLabel: string;
  booleanTrue: string;
  booleanFalse: string;
  fieldReady: string;
  fieldSelectionReady: string;
  fieldDateReady: string;
  fieldTextRecorded: (length: number) => string;
  fieldValidNumber: (value: unknown, unit: string) => string;
  fieldCategorySelected: (label: string) => string;
  fieldSelectedDate: (value: string) => string;
  fieldBooleanSelection: (label: string) => string;
  fieldSeriesRecorded: (count: number) => string;
  seriesAddRow: string;
  seriesRemoveRow: string;
  seriesTimestamp: string;
  seriesValue: string;
  seriesEmpty: string;
  formMetaFields: (count: number) => string;
  formMetaReports: (count: number) => string;
  formMetaSubmits: (count: number) => string;
  formStatusLabel: (status: FormStatus) => string;
  reportStatusLabel: (status: ReportStatus) => string;
  reportsEmptyTitle: string;
  reportsEmptyBody: string;
}

export type PrimitiveTextOverrides = Partial<PrimitiveText>;

export const primitiveStaticText: PrimitiveText = Object.freeze({
  formEyebrow: "Form",
  reportEyebrow: "Report",
  formErrorsTitle: "Form errors",
  helpActionLabel: "Help",
  helpActionGlyph: "?",
  categoryPlaceholder: "Select",
  unsupportedMapping: (role: string, component: string): string =>
    `Missing primitive mapping for ${role} ${component}.`,
  classifierEmpty: "No classifier output yet.",
  classifierAriaLabel: "Classifier report",
  classifierUnknownPrediction: "Unknown",
  classifierClassLabel: (index: number): string => `Class ${index + 1}`,
  regressorEmpty: "No regression output yet.",
  regressorAriaLabel: "Regressor report",
  regressorExecutionTime: (value: string): string => `Execution time: ${value}`,
  explanationLabel: "Explanation",
  explanationAriaLabel: "Model explanation",
  explanationLoadingLabel: "Loading explanation...",
  booleanTrue: "True",
  booleanFalse: "False",
  fieldReady: "Value ready.",
  fieldSelectionReady: "Selection ready.",
  fieldDateReady: "Date ready.",
  fieldTextRecorded: (length: number): string => `Text recorded (${length} characters).`,
  fieldValidNumber: (value: unknown, unit: string): string =>
    `Valid number: ${String(value)}${unit}.`,
  fieldCategorySelected: (label: string): string => `Category selected: ${label}.`,
  fieldSelectedDate: (value: string): string => `Selected date: ${value}.`,
  fieldBooleanSelection: (label: string): string => `Selection recorded: ${label}.`,
  fieldSeriesRecorded: (count: number): string =>
    `Series ready (${count} ${count === 1 ? "point" : "points"}).`,
  seriesAddRow: "Add point",
  seriesRemoveRow: "Remove point",
  seriesTimestamp: "Timestamp",
  seriesValue: "Value",
  seriesEmpty: "No points yet.",
  formMetaFields: (count: number): string => `${count} fields`,
  formMetaReports: (count: number): string => `${count} reports`,
  formMetaSubmits: (count: number): string => `${count} submits`,
  formStatusLabel: (status: FormStatus): string => {
    switch (status) {
      case "idle":
        return "Idle";
      case "editing":
        return "Editing";
      case "validating":
        return "Validating";
      case "submitting":
        return "Submitting";
      case "success":
        return "Success";
      case "error":
        return "Error";
    }
  },
  reportStatusLabel: (status: ReportStatus): string => {
    switch (status) {
      case "idle":
        return "Idle";
      case "loading":
        return "Loading";
      case "ready":
        return "Ready";
      case "error":
        return "Error";
    }
  },
  reportsEmptyTitle: "Results",
  reportsEmptyBody: "Reports will appear here after the form is submitted.",
});

export const resolvePrimitiveText = (overrides?: PrimitiveTextOverrides): PrimitiveText => {
  return overrides ? Object.freeze({ ...primitiveStaticText, ...overrides }) : primitiveStaticText;
};

export const primitiveIdPrefixes = {
  booleanGroup: "mlf-boolean",
  fieldDescription: "mlf-field-description",
  fieldErrors: "mlf-field-errors",
  fieldControl: "mlf-field-control",
  reportRegion: "mlf-report-region",
  explanationRegion: "mlf-explanation-region",
} as const;
