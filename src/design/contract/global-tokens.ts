// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

/**
 * Canonical neutral-light color values. Single source of truth shared by
 * `globalTokenDefaults` (fallback layer) and `neutralTheme.schemes.light`.
 * Edit here; both consumers update automatically.
 */
export const neutralLightColorTokens: Record<string, string> = {
  "--mlf-color-bg": "#f4f6f8",
  "--mlf-color-surface": "#ffffff",
  "--mlf-color-surface-muted": "#f0f3f6",
  "--mlf-color-surface-elevated": "#ffffff",
  "--mlf-color-text": "#172330",
  "--mlf-color-text-muted": "#526170",
  "--mlf-color-text-inverse": "#ffffff",
  "--mlf-color-border": "#d9e1e7",
  "--mlf-color-border-strong": "#b9c5cf",
  "--mlf-color-accent": "#2456c7",
  "--mlf-color-accent-hover": "#1b46a8",
  "--mlf-color-accent-soft": "rgba(36, 86, 199, 0.09)",
  "--mlf-color-success": "#16704f",
  "--mlf-color-warning": "#9a640e",
  "--mlf-color-danger": "#b93636",
  "--mlf-color-danger-soft": "rgba(185, 54, 54, 0.08)",
  "--mlf-color-focus-ring": "rgba(36, 86, 199, 0.18)",
  "--mlf-color-overlay": "rgba(255, 255, 255, 0.88)",
  "--mlf-color-hover-surface": "#e8edf2",
  "--mlf-color-chart-track": "rgba(23, 35, 48, 0.11)",
};

export const globalTokenDefaults: Record<string, string> = {
  "--mlf-font-family-body":
    '"Aptos", "Segoe UI Variable Text", "Segoe UI", ui-sans-serif, system-ui, sans-serif',
  "--mlf-font-family-heading":
    '"Aptos Display", "Segoe UI Variable Display", "Segoe UI", ui-sans-serif, system-ui, sans-serif',
  "--mlf-font-family-ui":
    'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  "--mlf-font-family-mono":
    'ui-monospace, "SFMono-Regular", "SF Mono", Consolas, "Liberation Mono", monospace',
  "--mlf-font-size-xs": "0.72rem",
  "--mlf-font-size-sm": "0.84rem",
  "--mlf-font-size-md": "1rem",
  "--mlf-font-size-lg": "1.125rem",
  "--mlf-font-size-xl": "1.55rem",
  "--mlf-font-size-2xl": "2.15rem",
  "--mlf-line-height-tight": "1.12",
  "--mlf-line-height-normal": "1.5",
  "--mlf-space-1": "0.25rem",
  "--mlf-space-2": "0.5rem",
  "--mlf-space-3": "0.75rem",
  "--mlf-space-4": "1rem",
  "--mlf-space-5": "1.25rem",
  "--mlf-space-6": "1.5rem",
  "--mlf-space-7": "2rem",
  "--mlf-space-8": "3rem",
  "--mlf-radius-sm": "6px",
  "--mlf-radius-md": "8px",
  "--mlf-radius-lg": "10px",
  "--mlf-radius-xl": "14px",
  "--mlf-radius-pill": "999px",
  "--mlf-border-width": "1px",
  "--mlf-ring-width": "4px",
  "--mlf-shadow-sm": "0 1px 2px rgba(23, 35, 48, 0.04)",
  "--mlf-shadow-md": "0 8px 24px rgba(23, 35, 48, 0.06)",
  "--mlf-shadow-lg": "0 18px 40px rgba(23, 35, 48, 0.09)",
  "--mlf-motion-fast": "140ms ease",
  "--mlf-motion-base": "180ms ease",
  "--mlf-motion-slow": "260ms ease",
  "--mlf-transition-duration": "200ms",
  "--mlf-transition-easing": "ease-in-out",
  "--mlf-layout-gap": "1rem",
  "--mlf-section-gap": "1rem",
  "--mlf-pane-gap": "1rem",
  "--mlf-shell-gap": "1.2rem",
  "--mlf-control-height": "3rem",
  "--mlf-control-padding-inline": "0.92rem",
  "--mlf-control-padding-block": "0.78rem",
  "--mlf-pane-min-width": "20rem",
  ...neutralLightColorTokens,
};
