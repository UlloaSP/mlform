// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { ThemeManifest } from "../types";

export const neutralTheme: ThemeManifest = {
  id: "neutral",
  label: "Neutral",
  schemes: {
    light: {
      colorScheme: "light",
      tokens: {
        "--mlf-color-bg": "#f6f3ee",
        "--mlf-color-surface": "#fffdf9",
        "--mlf-color-surface-muted": "#f1ece4",
        "--mlf-color-surface-elevated": "#ffffff",
        "--mlf-color-text": "#1f2933",
        "--mlf-color-text-muted": "#5b6673",
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
      },
    },
    dark: {
      colorScheme: "dark",
      tokens: {
        "--mlf-color-bg": "#12161c",
        "--mlf-color-surface": "#181d24",
        "--mlf-color-surface-muted": "#212832",
        "--mlf-color-surface-elevated": "#202731",
        "--mlf-color-text": "#ebf1f7",
        "--mlf-color-text-muted": "#a5b1bd",
        "--mlf-color-border": "#313a47",
        "--mlf-color-border-strong": "#414b58",
        "--mlf-color-accent": "#71a7ff",
        "--mlf-color-accent-hover": "#93bdff",
        "--mlf-color-accent-soft": "rgba(113, 167, 255, 0.16)",
        "--mlf-color-success": "#42c88e",
        "--mlf-color-warning": "#ffbe5c",
        "--mlf-color-danger": "#ff7a72",
        "--mlf-color-danger-soft": "rgba(255, 122, 114, 0.14)",
        "--mlf-color-focus-ring": "rgba(113, 167, 255, 0.3)",
        "--mlf-color-overlay": "rgba(18, 22, 28, 0.84)",
        "--mlf-color-hover-surface": "#2a3440",
        "--mlf-color-chart-track": "rgba(165, 177, 189, 0.18)",
      },
    },
  },
};
