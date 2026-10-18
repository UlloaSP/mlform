// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { ThemeManifest } from "../types";

export const eshkraTheme: ThemeManifest = {
  id: "eshkra",
  label: "eshkra",
  sharedTokens: {
    "--mlf-font-family-body":
      '"Mona Sans Variable", "Mona Sans", ui-sans-serif, system-ui, sans-serif',
    "--mlf-font-family-heading":
      '"Mona Sans Variable", "Mona Sans", ui-sans-serif, system-ui, sans-serif',
    "--mlf-font-family-ui":
      '"Mona Sans Variable", "Mona Sans", ui-sans-serif, system-ui, sans-serif',
    "--mlf-font-family-mono":
      '"JetBrains Mono Variable", "JetBrains Mono", ui-monospace, monospace',
    "--mlf-radius-md": "8px",
    "--mlf-radius-lg": "12px",
    "--mlf-ring-width": "3px",
  },
  schemes: {
    light: {
      colorScheme: "light",
      tokens: {
        "--mlf-color-bg": "#ffffff",
        "--mlf-color-surface": "#ffffff",
        "--mlf-color-surface-muted": "#f7f7f9",
        "--mlf-color-surface-elevated": "#ffffff",
        "--mlf-color-text": "#0b0b10",
        "--mlf-color-text-muted": "#666675",
        "--mlf-color-text-inverse": "#ffffff",
        "--mlf-color-border": "#e7e7ee",
        "--mlf-color-border-strong": "#d2d2dc",
        // The ink shade keeps small text on orange controls readable.
        "--mlf-color-accent": "#c2410c",
        "--mlf-color-accent-hover": "#a8380b",
        "--mlf-color-accent-soft": "rgba(232, 89, 12, 0.09)",
        "--mlf-color-success": "#16704f",
        "--mlf-color-warning": "#805907",
        "--mlf-color-danger": "#b93636",
        "--mlf-color-danger-soft": "rgba(185, 54, 54, 0.08)",
        "--mlf-color-focus-ring": "rgba(232, 89, 12, 0.20)",
        "--mlf-color-overlay": "rgba(255, 255, 255, 0.88)",
        "--mlf-color-hover-surface": "#fff0e8",
        "--mlf-color-chart-track": "rgba(11, 11, 16, 0.12)",
      },
    },
    dark: {
      colorScheme: "dark",
      tokens: {
        "--mlf-color-bg": "#0a0a0d",
        "--mlf-color-surface": "#131318",
        "--mlf-color-surface-muted": "#1a1a21",
        "--mlf-color-surface-elevated": "#1c1c24",
        "--mlf-color-text": "#f4f4f6",
        "--mlf-color-text-muted": "#b6b6c2",
        "--mlf-color-text-inverse": "#0a0a0d",
        "--mlf-color-border": "#24242c",
        "--mlf-color-border-strong": "#34343e",
        "--mlf-color-accent": "#ff9a55",
        "--mlf-color-accent-hover": "#ffb47f",
        "--mlf-color-accent-soft": "rgba(255, 138, 61, 0.12)",
        "--mlf-color-success": "#65d2a1",
        "--mlf-color-warning": "#efbb67",
        "--mlf-color-danger": "#ff8e8a",
        "--mlf-color-danger-soft": "rgba(255, 142, 138, 0.12)",
        "--mlf-color-focus-ring": "rgba(255, 138, 61, 0.28)",
        "--mlf-color-overlay": "rgba(10, 10, 13, 0.88)",
        "--mlf-color-hover-surface": "#29221f",
        "--mlf-color-chart-track": "rgba(182, 182, 194, 0.18)",
      },
    },
  },
};
