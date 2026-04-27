// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { ThemeManifest } from "../types";

export const cobaltTheme: ThemeManifest = {
  id: "cobalt",
  label: "Cobalt",
  schemes: {
    light: {
      colorScheme: "light",
      tokens: {
        "--mlf-color-bg": "#eef4fb",
        "--mlf-color-surface": "#ffffff",
        "--mlf-color-surface-muted": "#e5eef8",
        "--mlf-color-surface-elevated": "#ffffff",
        "--mlf-color-text": "#11243a",
        "--mlf-color-text-muted": "#49627d",
        "--mlf-color-border": "#c6d7ea",
        "--mlf-color-border-strong": "#afc6dd",
        "--mlf-color-accent": "#1f5eff",
        "--mlf-color-accent-hover": "#174fdc",
        "--mlf-color-accent-soft": "rgba(31, 94, 255, 0.12)",
        "--mlf-color-success": "#198754",
        "--mlf-color-warning": "#d4861b",
        "--mlf-color-danger": "#d64545",
        "--mlf-color-danger-soft": "rgba(214, 69, 69, 0.12)",
        "--mlf-color-focus-ring": "rgba(31, 94, 255, 0.24)",
        "--mlf-color-overlay": "rgba(255, 255, 255, 0.78)",
        "--mlf-color-hover-surface": "#d8e5f6",
        "--mlf-color-chart-track": "rgba(17, 36, 58, 0.12)",
      },
    },
    dark: {
      colorScheme: "dark",
      tokens: {
        "--mlf-shadow-sm": "0 1px 3px rgba(0, 0, 0, 0.45)",
        "--mlf-shadow-md": "0 14px 30px rgba(0, 0, 0, 0.35)",
        "--mlf-shadow-lg": "0 24px 60px rgba(0, 0, 0, 0.28)",
        "--mlf-color-bg": "#0d1524",
        "--mlf-color-surface": "#111c30",
        "--mlf-color-surface-muted": "#16233b",
        "--mlf-color-surface-elevated": "#1a2944",
        "--mlf-color-text": "#edf4ff",
        "--mlf-color-text-muted": "#a3b5cf",
        "--mlf-color-border": "#243552",
        "--mlf-color-border-strong": "#304465",
        "--mlf-color-accent": "#68a0ff",
        "--mlf-color-accent-hover": "#8ab7ff",
        "--mlf-color-accent-soft": "rgba(104, 160, 255, 0.16)",
        "--mlf-color-success": "#3ad38a",
        "--mlf-color-warning": "#ffbb5d",
        "--mlf-color-danger": "#ff7f86",
        "--mlf-color-danger-soft": "rgba(255, 127, 134, 0.14)",
        "--mlf-color-focus-ring": "rgba(104, 160, 255, 0.3)",
        "--mlf-color-overlay": "rgba(13, 21, 36, 0.82)",
        "--mlf-color-hover-surface": "#1f3151",
        "--mlf-color-chart-track": "rgba(163, 181, 207, 0.18)",
      },
    },
  },
};
