// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

export const kitErrorMessages = {
  invalidDesignSystemSnapshot: "replaceDesignSystem requires an explicit mode, theme, and recipe.",
  customRegionRequiresHost: (id: string) =>
    `Custom region "${id}" requires an application-owned layout. Use createFormView and render that region in your host.`,
} as const;

export const kitTagNames = {
  wizard: "mlf-kit-wizard",
  tabs: "mlf-kit-tabs",
  disclosure: "mlf-kit-disclosure",
  stepIndicator: "mlf-kit-step-indicator",
} as const;
