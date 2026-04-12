// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

/**
 * All `--mlf-*` CSS custom property keys defined by the design system.
 *
 * Use with `(string & {})` to get IDE autocompletion while still accepting
 * arbitrary custom properties:
 *
 * ```ts
 * const tokens: Record<MlfTokenKey | (string & {}), string> = { ... };
 * ```
 */
export const mlfTokenKeys = [
  // Global: Typography
  "--mlf-font-family-body",
  "--mlf-font-family-heading",
  "--mlf-font-family-ui",
  "--mlf-font-family-mono",
  "--mlf-font-size-xs",
  "--mlf-font-size-sm",
  "--mlf-font-size-md",
  "--mlf-font-size-lg",
  "--mlf-font-size-xl",
  "--mlf-font-size-2xl",
  "--mlf-line-height-tight",
  "--mlf-line-height-normal",
  // Global: Spacing
  "--mlf-space-1",
  "--mlf-space-2",
  "--mlf-space-3",
  "--mlf-space-4",
  "--mlf-space-5",
  "--mlf-space-6",
  "--mlf-space-7",
  "--mlf-space-8",
  // Global: Shape
  "--mlf-radius-sm",
  "--mlf-radius-md",
  "--mlf-radius-lg",
  "--mlf-radius-xl",
  "--mlf-radius-pill",
  "--mlf-border-width",
  "--mlf-ring-width",
  // Global: Elevation
  "--mlf-shadow-sm",
  "--mlf-shadow-md",
  "--mlf-shadow-lg",
  // Global: Motion
  "--mlf-motion-fast",
  "--mlf-motion-base",
  "--mlf-motion-slow",
  // Global: Transition (for theme/scheme switch animations)
  "--mlf-transition-duration",
  "--mlf-transition-easing",
  // Global: Layout
  "--mlf-layout-gap",
  "--mlf-section-gap",
  "--mlf-pane-gap",
  "--mlf-shell-gap",
  "--mlf-control-height",
  "--mlf-control-padding-inline",
  "--mlf-control-padding-block",
  "--mlf-pane-min-width",
  // Global: Color
  "--mlf-color-bg",
  "--mlf-color-surface",
  "--mlf-color-surface-muted",
  "--mlf-color-surface-elevated",
  "--mlf-color-text",
  "--mlf-color-text-muted",
  "--mlf-color-text-inverse",
  "--mlf-color-border",
  "--mlf-color-border-strong",
  "--mlf-color-accent",
  "--mlf-color-accent-hover",
  "--mlf-color-accent-soft",
  "--mlf-color-success",
  "--mlf-color-warning",
  "--mlf-color-danger",
  "--mlf-color-danger-soft",
  "--mlf-color-focus-ring",
  "--mlf-color-overlay",
  "--mlf-color-hover-surface",
  "--mlf-color-chart-track",
  // Component: Shell
  "--mlf-shell-color",
  "--mlf-shell-bg",
  "--mlf-shell-overlay",
  "--mlf-shell-panel-bg",
  "--mlf-shell-panel-border",
  "--mlf-shell-panel-shadow-soft",
  "--mlf-shell-panel-shadow",
  "--mlf-shell-header-bg",
  "--mlf-shell-header-blur",
  "--mlf-shell-action-bg",
  "--mlf-shell-left-min-width",
  "--mlf-shell-left-max-width",
  "--mlf-shell-right-min-width",
  // Component: Hero
  "--mlf-hero-bg",
  "--mlf-hero-border",
  "--mlf-hero-shadow",
  "--mlf-hero-radius",
  "--mlf-hero-eyebrow-color",
  "--mlf-hero-status-bg",
  // Component: Field
  "--mlf-field-bg",
  "--mlf-field-border",
  "--mlf-field-border-invalid",
  "--mlf-field-shadow",
  "--mlf-field-radius",
  "--mlf-field-label-color",
  "--mlf-field-description-color",
  "--mlf-field-meta-bg",
  "--mlf-field-meta-color",
  "--mlf-field-error-bg",
  "--mlf-field-error-color",
  // Component: Report
  "--mlf-report-bg",
  "--mlf-report-border",
  "--mlf-report-shadow",
  "--mlf-report-radius",
  "--mlf-report-label-color",
  "--mlf-report-description-color",
  "--mlf-report-meta-bg",
  "--mlf-report-meta-color",
  "--mlf-report-empty-bg",
  "--mlf-report-empty-color",
  "--mlf-report-hero-bg",
  "--mlf-report-error-bg",
  "--mlf-report-error-color",
  // Component: Input
  "--mlf-input-bg",
  "--mlf-input-bg-disabled",
  "--mlf-input-border",
  "--mlf-input-border-focus",
  "--mlf-input-text",
  "--mlf-input-placeholder",
  "--mlf-input-radius",
  "--mlf-input-shadow-focus",
  // Component: Submit
  "--mlf-submit-bg",
  "--mlf-submit-bg-hover",
  "--mlf-submit-color",
  "--mlf-submit-shadow",
  "--mlf-submit-shadow-hover",
  "--mlf-submit-radius",
  "--mlf-submit-focus-ring",
  // Component: Error
  "--mlf-error-bg",
  "--mlf-error-border",
  "--mlf-error-color",
  // Component: Toggle
  "--mlf-toggle-bg",
  "--mlf-toggle-border",
  "--mlf-toggle-text",
  "--mlf-toggle-accent",
  // Component: Status
  "--mlf-status-bg",
  "--mlf-status-color",
  // Component: Chart
  "--mlf-chart-track-bg",
  "--mlf-chart-fill-bg",
] as const;

export type MlfTokenKey = (typeof mlfTokenKeys)[number];
