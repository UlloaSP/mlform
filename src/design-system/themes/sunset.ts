// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { ThemeManifest } from "../types";

export const sunsetTheme: ThemeManifest = {
  id: "sunset",
  label: "Sunset",
  schemes: {
    light: {
      colorScheme: "light",
      tokens: {
        "--mlf-color-bg": "#fff6f0",
        "--mlf-color-surface": "#fffdfb",
        "--mlf-color-surface-muted": "#ffe9dd",
        "--mlf-color-surface-elevated": "#ffffff",
        "--mlf-color-text": "#3b241d",
        "--mlf-color-text-muted": "#7f5a50",
        "--mlf-color-border": "#f0cdbb",
        "--mlf-color-border-strong": "#e0b59f",
        "--mlf-color-accent": "#d96a3a",
        "--mlf-color-accent-hover": "#be5628",
        "--mlf-color-accent-soft": "rgba(217, 106, 58, 0.14)",
        "--mlf-color-success": "#2e8c63",
        "--mlf-color-warning": "#d18a20",
        "--mlf-color-danger": "#ca4a45",
        "--mlf-color-danger-soft": "rgba(202, 74, 69, 0.12)",
        "--mlf-color-focus-ring": "rgba(217, 106, 58, 0.24)",
        "--mlf-color-overlay": "rgba(255, 253, 251, 0.8)",
        "--mlf-color-hover-surface": "#ffdcca",
        "--mlf-color-chart-track": "rgba(59, 36, 29, 0.12)",
      },
    },
    dark: {
      colorScheme: "dark",
      tokens: {
        "--mlf-shadow-sm": "0 1px 3px rgba(0, 0, 0, 0.45)",
        "--mlf-shadow-md": "0 14px 30px rgba(0, 0, 0, 0.35)",
        "--mlf-shadow-lg": "0 24px 60px rgba(0, 0, 0, 0.28)",
        "--mlf-color-bg": "#1e1512",
        "--mlf-color-surface": "#261b18",
        "--mlf-color-surface-muted": "#32231f",
        "--mlf-color-surface-elevated": "#392925",
        "--mlf-color-text": "#fff1ea",
        "--mlf-color-text-muted": "#d3b0a3",
        "--mlf-color-border": "#513830",
        "--mlf-color-border-strong": "#68473d",
        "--mlf-color-accent": "#ff986b",
        "--mlf-color-accent-hover": "#ffb089",
        "--mlf-color-accent-soft": "rgba(255, 152, 107, 0.16)",
        "--mlf-color-success": "#57c694",
        "--mlf-color-warning": "#ffc36d",
        "--mlf-color-danger": "#ff8d86",
        "--mlf-color-danger-soft": "rgba(255, 141, 134, 0.14)",
        "--mlf-color-focus-ring": "rgba(255, 152, 107, 0.3)",
        "--mlf-color-overlay": "rgba(30, 21, 18, 0.84)",
        "--mlf-color-hover-surface": "#422d27",
        "--mlf-color-chart-track": "rgba(211, 176, 163, 0.18)",
      },
    },
  },
};
