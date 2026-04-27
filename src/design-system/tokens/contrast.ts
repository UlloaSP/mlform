// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

/**
 * Token overrides applied when `prefers-contrast: more` is active and
 * the consumer has not explicitly set contrast-sensitive tokens.
 *
 * These increase border widths, strengthen border colors, and remove
 * semi-transparent backgrounds that reduce legibility under high contrast.
 */
export const contrastTokenOverrides: Record<string, string> = {
  "--mlf-border-width": "1.5px",
  "--mlf-ring-width": "5px",
  "--mlf-color-border": "var(--mlf-color-border-strong)",
};
