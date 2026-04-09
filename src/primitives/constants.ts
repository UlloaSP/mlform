// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

export const primitiveTagNames = {
  form: "mlf-form",
  formErrors: "mlf-form-errors",
  submitButton: "mlf-submit-button",
  unsupportedComponent: "mlf-unsupported-component",
  fieldFrame: "mlf-field-frame",
  reportFrame: "mlf-report-frame",
  textField: "mlf-text-field",
  numberField: "mlf-number-field",
  booleanField: "mlf-boolean-field",
  categoryField: "mlf-category-field",
  dateField: "mlf-date-field",
  timeSeriesField: "mlf-time-series-field",
  classifierReport: "mlf-classifier-report",
  regressorReport: "mlf-regressor-report",
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

export const primitiveStaticText = {
  formEyebrow: "Form",
  reportEyebrow: "Report",
  formErrorsTitle: "Form errors",
  helpActionLabel: "Help",
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
  fieldTimeSeriesRecorded: (count: number): string =>
    `Series ready (${count} ${count === 1 ? "point" : "points"}).`,
  timeSeriesAddRow: "Add point",
  timeSeriesRemoveRow: "Remove point",
  timeSeriesTimestamp: "Timestamp",
  timeSeriesValue: "Value",
  timeSeriesEmpty: "No points yet.",
} as const;

export const primitiveIdPrefixes = {
  booleanGroup: "mlf-boolean",
  fieldDescription: "mlf-field-description",
  fieldErrors: "mlf-field-errors",
  fieldControl: "mlf-field-control",
  reportRegion: "mlf-report-region",
} as const;
