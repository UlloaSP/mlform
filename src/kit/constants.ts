// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

export const kitErrorMessages = {
  invalidDesignSystemSnapshot: "replaceDesignSystem requires an explicit mode, theme, and recipe.",
} as const;

export { transportDefaults as kitTransportDefaults, transportErrorMessages } from "@/transport";
