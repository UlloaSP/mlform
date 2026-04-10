// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

export const builtinReportKinds = {
  classifier: "classifier",
  regressor: "regressor",
} as const;

export const builtinLegacyOutputTypes = {
  classifier: builtinReportKinds.classifier,
  regressor: builtinReportKinds.regressor,
} as const;

export const builtinFieldKinds = {
  text: "text",
  number: "number",
  boolean: "boolean",
  category: "category",
  date: "date",
  timeSeries: "time-series",
} as const;

export const builtinReportLabels = {
  classifier: "Classifier report",
  regressor: "Regressor report",
} as const;

export const builtinReportFallbacks = {
  unknownPrediction: "Unknown",
  classifierClassLabel: (index: number): string => `Class ${index + 1}`,
} as const;

export const builtinValidationMessages = {
  invalidNumber: "Value must be a valid number.",
  textPatternMismatch: "Value does not match the expected pattern.",
  booleanRequired: "This field must be accepted.",
  categoryOptionMismatch: "Value must match one of the available options.",
  invalidTextLengthRange: "Minimum length cannot exceed maximum length.",
  invalidNumericRange: "Minimum value cannot exceed maximum value.",
  invalidDateRange: "Minimum date cannot be after maximum date.",
  invalidPointCountRange: "Minimum number of points cannot exceed maximum number of points.",
  minLength: (value: number): string => `Minimum length is ${value} characters.`,
  maxLength: (value: number): string => `Maximum length is ${value} characters.`,
  minValue: (value: number): string => `Minimum value is ${value}.`,
  maxValue: (value: number): string => `Maximum value is ${value}.`,
  dateOnOrAfter: (value: string): string => `Date must be on or after ${value}.`,
  dateOnOrBefore: (value: string): string => `Date must be on or before ${value}.`,
} as const;
