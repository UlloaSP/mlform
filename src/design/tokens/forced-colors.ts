// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

/**
 * Token overrides applied when `forced-colors: active` is detected (e.g.
 * Windows High Contrast Mode). Maps semantic tokens to CSS system colors
 * so the browser's forced-color palette is respected.
 *
 * Component tokens that normally use gradients are flattened to solid
 * system colors — gradients cannot render system colors reliably in all
 * forced-colors implementations.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/CSS/system-color
 */
export const forcedColorsTokenOverrides: Record<string, string> = {
  // ── Global: Color ────────────────────────────────────────────────────
  "--mlf-color-bg": "Canvas",
  "--mlf-color-surface": "Canvas",
  "--mlf-color-surface-muted": "Canvas",
  "--mlf-color-surface-elevated": "Canvas",
  "--mlf-color-text": "CanvasText",
  "--mlf-color-text-muted": "CanvasText",
  "--mlf-color-text-inverse": "Canvas",
  "--mlf-color-border": "ButtonBorder",
  "--mlf-color-border-strong": "CanvasText",
  "--mlf-color-accent": "LinkText",
  "--mlf-color-accent-hover": "ActiveText",
  "--mlf-color-accent-soft": "Highlight",
  "--mlf-color-success": "CanvasText",
  "--mlf-color-warning": "CanvasText",
  "--mlf-color-danger": "CanvasText",
  "--mlf-color-danger-soft": "Canvas",
  "--mlf-color-focus-ring": "Highlight",
  "--mlf-color-overlay": "Canvas",
  "--mlf-color-hover-surface": "Highlight",
  "--mlf-color-chart-track": "ButtonBorder",
  // ── Global: Shape / Elevation ────────────────────────────────────────
  "--mlf-border-width": "2px",
  "--mlf-ring-width": "3px",
  "--mlf-shadow-sm": "none",
  "--mlf-shadow-md": "none",
  "--mlf-shadow-lg": "none",
  // ── Component: Shell (gradient → flat) ───────────────────────────────
  "--mlf-shell-overlay": "Canvas",
  "--mlf-shell-header-bg": "Canvas",
  // ── Component: Hero (gradient → flat) ────────────────────────────────
  "--mlf-hero-bg": "Canvas",
  "--mlf-hero-border": "ButtonBorder",
  "--mlf-hero-shadow": "none",
  // ── Component: Field (gradient → flat) ───────────────────────────────
  "--mlf-field-bg": "Canvas",
  "--mlf-field-border-invalid": "CanvasText",
  "--mlf-field-shadow": "none",
  // ── Component: Report (gradient → flat) ──────────────────────────────
  "--mlf-report-bg": "Canvas",
  "--mlf-report-shadow": "none",
  "--mlf-report-hero-bg": "Canvas",
  // ── Component: Input ─────────────────────────────────────────────────
  "--mlf-input-shadow-focus": "0 0 0 var(--mlf-ring-width) Highlight",
  // ── Component: Submit (gradient → flat) ──────────────────────────────
  "--mlf-submit-bg": "ButtonFace",
  "--mlf-submit-bg-hover": "Highlight",
  "--mlf-submit-color": "ButtonText",
  "--mlf-submit-shadow": "none",
  "--mlf-submit-shadow-hover": "none",
  "--mlf-submit-focus-ring": "0 0 0 var(--mlf-ring-width) Highlight",
  // ── Component: Error (gradient → flat) ───────────────────────────────
  "--mlf-error-bg": "Canvas",
  "--mlf-error-border": "CanvasText",
  // ── Component: Chart (gradient → flat) ───────────────────────────────
  "--mlf-chart-fill-bg": "Highlight",
};
