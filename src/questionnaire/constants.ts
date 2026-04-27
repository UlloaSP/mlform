// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

export const questionnaireTagNames = {
  questionnaire: "mlf-questionnaire",
  stepIndicator: "mlf-step-indicator",
} as const;

export const questionnaireEventNames = {
  stepChange: "mlf-step-change",
  stepValidationError: "mlf-step-validation-error",
  submitStart: "mlf-q-submit-start",
  submitAbort: "mlf-q-submit-abort",
  submitSuccess: "mlf-q-submit-success",
  submitError: "mlf-q-submit-error",
} as const;

export interface QuestionnaireLabels {
  prev?: string;
  next?: string;
  submit?: string;
  validating?: string;
  submitting?: string;
}

export interface QuestionnaireText {
  stepLabel: (current: number, total: number) => string;
  prevLabel: string;
  nextLabel: string;
  submitLabel: string;
  validatingLabel: string;
  submittingLabel: string;
}

export type QuestionnaireTextOverrides = Partial<QuestionnaireText>;

export const questionnaireDefaultLabels: Required<QuestionnaireLabels> = {
  prev: "Previous",
  next: "Next",
  submit: "Submit",
  validating: "Validating...",
  submitting: "Submitting...",
};

export const questionnaireStaticText: QuestionnaireText = Object.freeze({
  stepLabel: (current: number, total: number): string => `Step ${current} of ${total}`,
  prevLabel: "Previous",
  nextLabel: "Next",
  submitLabel: "Submit",
  validatingLabel: "Validating...",
  submittingLabel: "Submitting...",
});

export const resolveQuestionnaireText = (
  overrides?: QuestionnaireTextOverrides,
): QuestionnaireText => {
  return overrides
    ? Object.freeze({ ...questionnaireStaticText, ...overrides })
    : questionnaireStaticText;
};
