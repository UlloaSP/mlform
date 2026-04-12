// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

/**
 * Canonical neutral-light color values. Single source of truth shared by
 * `globalTokenDefaults` (fallback layer) and `neutralTheme.schemes.light`.
 * Edit here; both consumers update automatically.
 */
export const neutralLightColorTokens: Record<string, string> = {
  "--mlf-color-bg": "#f6f3ee",
  "--mlf-color-surface": "#fffdf9",
  "--mlf-color-surface-muted": "#f1ece4",
  "--mlf-color-surface-elevated": "#ffffff",
  "--mlf-color-text": "#1f2933",
  "--mlf-color-text-muted": "#5b6673",
  "--mlf-color-text-inverse": "#ffffff",
  "--mlf-color-border": "#ddd4c7",
  "--mlf-color-border-strong": "#c6baa9",
  "--mlf-color-accent": "#145c9e",
  "--mlf-color-accent-hover": "#0f4d84",
  "--mlf-color-accent-soft": "rgba(20, 92, 158, 0.12)",
  "--mlf-color-success": "#1f8a5b",
  "--mlf-color-warning": "#c17c1f",
  "--mlf-color-danger": "#be3a34",
  "--mlf-color-danger-soft": "rgba(190, 58, 52, 0.12)",
  "--mlf-color-focus-ring": "rgba(20, 92, 158, 0.24)",
  "--mlf-color-overlay": "rgba(255, 253, 249, 0.82)",
  "--mlf-color-hover-surface": "#ebe2d4",
  "--mlf-color-chart-track": "rgba(96, 120, 168, 0.12)",
};

export const globalTokenDefaults: Record<string, string> = {
  "--mlf-font-family-body":
    '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Palatino, "Times New Roman", serif',
  "--mlf-font-family-heading":
    '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Palatino, "Times New Roman", serif',
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
  "--mlf-radius-sm": "12px",
  "--mlf-radius-md": "16px",
  "--mlf-radius-lg": "22px",
  "--mlf-radius-xl": "28px",
  "--mlf-radius-pill": "999px",
  "--mlf-border-width": "1px",
  "--mlf-ring-width": "4px",
  "--mlf-shadow-sm": "0 1px 3px rgba(17, 24, 39, 0.08)",
  "--mlf-shadow-md": "0 14px 30px rgba(17, 24, 39, 0.08)",
  "--mlf-shadow-lg": "0 24px 60px rgba(17, 24, 39, 0.12)",
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
