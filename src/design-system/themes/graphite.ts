// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { ThemeManifest } from "../types";

export const graphiteTheme: ThemeManifest = {
  id: "graphite",
  label: "Graphite",
  schemes: {
    light: {
      colorScheme: "light",
      tokens: {
        "--mlf-color-bg": "#f1f4f7",
        "--mlf-color-surface": "#ffffff",
        "--mlf-color-surface-muted": "#e6ebf1",
        "--mlf-color-surface-elevated": "#ffffff",
        "--mlf-color-text": "#202934",
        "--mlf-color-text-muted": "#5d6977",
        "--mlf-color-border": "#cfd7e1",
        "--mlf-color-border-strong": "#bbc6d3",
        "--mlf-color-accent": "#375a7f",
        "--mlf-color-accent-hover": "#27445f",
        "--mlf-color-accent-soft": "rgba(55, 90, 127, 0.12)",
        "--mlf-color-success": "#1f8a5b",
        "--mlf-color-warning": "#c17c1f",
        "--mlf-color-danger": "#be3a34",
        "--mlf-color-danger-soft": "rgba(190, 58, 52, 0.12)",
        "--mlf-color-focus-ring": "rgba(55, 90, 127, 0.24)",
        "--mlf-color-overlay": "rgba(255, 255, 255, 0.78)",
        "--mlf-color-hover-surface": "#dbe2ea",
        "--mlf-color-chart-track": "rgba(32, 41, 52, 0.12)",
      },
    },
    dark: {
      colorScheme: "dark",
      tokens: {
        "--mlf-shadow-sm": "0 1px 3px rgba(0, 0, 0, 0.45)",
        "--mlf-shadow-md": "0 14px 30px rgba(0, 0, 0, 0.35)",
        "--mlf-shadow-lg": "0 24px 60px rgba(0, 0, 0, 0.28)",
        "--mlf-color-bg": "#0f1318",
        "--mlf-color-surface": "#171c22",
        "--mlf-color-surface-muted": "#202731",
        "--mlf-color-surface-elevated": "#24303d",
        "--mlf-color-text": "#ebf1f7",
        "--mlf-color-text-muted": "#9ca8b5",
        "--mlf-color-border": "#2c3642",
        "--mlf-color-border-strong": "#3b4754",
        "--mlf-color-accent": "#4ea1ff",
        "--mlf-color-accent-hover": "#82bbff",
        "--mlf-color-accent-soft": "rgba(78, 161, 255, 0.18)",
        "--mlf-color-success": "#37c78b",
        "--mlf-color-warning": "#ffb454",
        "--mlf-color-danger": "#ff6a61",
        "--mlf-color-danger-soft": "rgba(255, 106, 97, 0.14)",
        "--mlf-color-focus-ring": "rgba(78, 161, 255, 0.34)",
        "--mlf-color-overlay": "rgba(23, 28, 34, 0.84)",
        "--mlf-color-hover-surface": "#24303d",
        "--mlf-color-chart-track": "rgba(156, 168, 181, 0.18)",
      },
    },
  },
};
