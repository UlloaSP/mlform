// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

export const designSystemEventNames = {
  change: "ml-design-system-change",
} as const;

export const designSystemMediaQueries = {
  prefersDarkScheme: "(prefers-color-scheme: dark)",
} as const;

export const designSystemHostAttributeNames = {
  explicitScheme: "data-color-scheme",
  inheritedScheme: "data-mlf-scheme",
  effectiveScheme: "data-mlf-effective-scheme",
  style: "style",
  class: "class",
} as const;

export const designSystemObservedAttributeFilter = [
  designSystemHostAttributeNames.inheritedScheme,
  designSystemHostAttributeNames.effectiveScheme,
  designSystemHostAttributeNames.explicitScheme,
  designSystemHostAttributeNames.style,
  designSystemHostAttributeNames.class,
] as const;
