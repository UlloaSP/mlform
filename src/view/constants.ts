// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

export const viewErrorMessages = {
  sectionRequiresTitle: "Disclosure sections require a non-empty title.",
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
  unknownTab: (tabId: string) => `Unknown tab "${tabId}".`,
  unknownWizardStep: (stepId: string) => `Unknown wizard step "${stepId}".`,
  unknownDisclosureSection: (sectionId: string) => `Unknown disclosure section "${sectionId}".`,
} as const;
