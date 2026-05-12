// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

export interface WizardLabels {
  prev?: string;
  next?: string;
  submit?: string;
  validating?: string;
  submitting?: string;
}

export interface WizardText {
  stepLabel: (current: number, total: number) => string;
  prevLabel: string;
  nextLabel: string;
  submitLabel: string;
  validatingLabel: string;
  submittingLabel: string;
}

export type WizardTextOverrides = Partial<WizardText>;

export const defaultWizardLabels: Required<WizardLabels> = {
  prev: "Previous",
  next: "Next",
  submit: "Submit",
  validating: "Validating...",
  submitting: "Submitting...",
};

export const wizardStaticText: WizardText = Object.freeze({
  stepLabel: (current: number, total: number): string => `Step ${current} of ${total}`,
  prevLabel: "Previous",
  nextLabel: "Next",
  submitLabel: "Submit",
  validatingLabel: "Validating...",
  submittingLabel: "Submitting...",
});

export const resolveWizardText = (overrides?: WizardTextOverrides): WizardText => {
  return overrides ? Object.freeze({ ...wizardStaticText, ...overrides }) : wizardStaticText;
};
