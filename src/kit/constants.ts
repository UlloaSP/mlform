// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

export const kitErrorMessages = {
  invalidDesignSystemSnapshot: "replaceDesignSystem requires an explicit mode, theme, and recipe.",
  fieldDuplicateInLayout: (fieldId: string) =>
    `Field "${fieldId}" appears multiple times in layout.`,
  fieldMissingInLayout: (fieldId: string) => `Field "${fieldId}" is missing from layout.`,
  reportDuplicateInLayout: (reportId: string) =>
    `Report "${reportId}" appears multiple times in layout.`,
  unknownFieldReference: (fieldId: string) => `Layout references unknown field "${fieldId}".`,
  unknownReportReference: (reportId: string) => `Layout references unknown report "${reportId}".`,
  wizardRequiresSteps: "Wizard layout must define at least one step.",
  wizardStepEmpty: (stepId: string) =>
    `Wizard step "${stepId}" must contain at least one layout node.`,
  tabsRequiresTabs: "Tabs layout must define at least one tab.",
  tabEmpty: (tabId: string) => `Tab "${tabId}" must contain at least one layout node.`,
  nonWizardNextStep: "nextStep() is only available for wizard layouts.",
  nonWizardGoToStep: "goToStep() is only available for wizard layouts.",
  nonTabsSetActiveTab: "setActiveTab() is only available for tabs layouts.",
  unknownTab: (tabId: string) => `Unknown tab "${tabId}".`,
  unknownWizardStep: (stepId: string) => `Unknown wizard step "${stepId}".`,
  unknownDisclosureSection: (sectionId: string) => `Unknown disclosure section "${sectionId}".`,
} as const;

export const kitTagNames = {
  wizard: "mlf-kit-wizard",
  tabs: "mlf-kit-tabs",
  disclosure: "mlf-kit-disclosure",
  stepIndicator: "mlf-kit-step-indicator",
} as const;

export { transportDefaults as kitTransportDefaults, transportErrorMessages } from "@/transport";
