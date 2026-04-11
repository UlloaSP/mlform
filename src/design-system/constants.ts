// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

export const designSystemEventNames = {
  change: "ml-design-system-change",
} as const;

export const designSystemMediaQueries = {
  prefersDarkScheme: "(prefers-color-scheme: dark)",
  prefersReducedMotion: "(prefers-reduced-motion: reduce)",
} as const;

export const designSystemHostAttributeNames = {
  explicitScheme: "data-color-scheme",
  inheritedScheme: "data-mlf-scheme",
  effectiveScheme: "data-mlf-effective-scheme",
  themeId: "data-mlf-theme-id",
  recipeId: "data-mlf-recipe-id",
  density: "data-mlf-density",
  motion: "data-mlf-motion",
  style: "style",
  class: "class",
} as const;

/**
 * Attributes observed on the HOST element — only externally-controlled scheme
 * attributes. Excludes `style` and our own `data-mlf-*` writes to prevent
 * self-triggering the MutationObserver on every `applyResolvedDesignSystem` call.
 */
export const designSystemHostObservedAttributeFilter = [
  designSystemHostAttributeNames.explicitScheme,
] as const;

/**
 * Attributes observed on ANCESTOR elements for inherited scheme detection.
 * Includes `style` and `class` because an ancestor may set `color-scheme`
 * via CSS or a class selector.
 */
export const designSystemAncestorObservedAttributeFilter = [
  designSystemHostAttributeNames.inheritedScheme,
  designSystemHostAttributeNames.effectiveScheme,
  designSystemHostAttributeNames.explicitScheme,
  designSystemHostAttributeNames.style,
  designSystemHostAttributeNames.class,
] as const;
