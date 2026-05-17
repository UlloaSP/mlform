// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { ThemeManifest } from "../types";

export const clickHouseTheme: ThemeManifest = {
  id: "clickhouse",
  label: "ClickHouse",
  schemes: {
    light: {
      colorScheme: "light",
      tokens: {
        "--mlf-font-family":
          'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        "--mlf-font-family-mono":
          '"JetBrains Mono", "SFMono-Regular", Consolas, "Liberation Mono", monospace',

        "--mlf-shadow-sm": "none",
        "--mlf-shadow-md": "none",
        "--mlf-shadow-lg": "none",

        "--mlf-radius-sm": "6px",
        "--mlf-radius-md": "8px",
        "--mlf-radius-lg": "12px",
        "--mlf-radius-xl": "12px",
        "--mlf-radius-full": "9999px",

        "--mlf-color-bg": "#f7f7f2",
        "--mlf-color-surface": "#ffffff",
        "--mlf-color-surface-muted": "#eeeeea",
        "--mlf-color-surface-elevated": "#f4f4ef",

        "--mlf-color-text": "#0a0a0a",
        "--mlf-color-text-muted": "#5a5a5a",

        "--mlf-color-border": "#d8d8cf",
        "--mlf-color-border-strong": "#bdbdaf",

        "--mlf-color-accent": "#e6eb52",
        "--mlf-color-accent-hover": "#d6dc3f",
        "--mlf-color-accent-soft": "rgba(230, 235, 82, 0.28)",

        "--mlf-color-success": "#16803a",
        "--mlf-color-warning": "#9a7b00",
        "--mlf-color-danger": "#c73939",
        "--mlf-color-danger-soft": "rgba(199, 57, 57, 0.12)",

        "--mlf-color-focus-ring": "rgba(230, 235, 82, 0.42)",
        "--mlf-color-overlay": "rgba(247, 247, 242, 0.84)",
        "--mlf-color-hover-surface": "#eeeeea",
        "--mlf-color-chart-track": "rgba(10, 10, 10, 0.12)",

        "--mlf-color-code-bg": "#1a1a1a",
        "--mlf-color-code-text": "#e6e6e6",
        "--mlf-color-info": "#3b82f6",
      },
    },
    dark: {
      colorScheme: "dark",
      tokens: {
        "--mlf-font-family":
          'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        "--mlf-font-family-mono":
          '"JetBrains Mono", "SFMono-Regular", Consolas, "Liberation Mono", monospace',

        "--mlf-shadow-sm": "none",
        "--mlf-shadow-md": "none",
        "--mlf-shadow-lg": "none",

        "--mlf-radius-sm": "6px",
        "--mlf-radius-md": "8px",
        "--mlf-radius-lg": "12px",
        "--mlf-radius-xl": "12px",
        "--mlf-radius-full": "9999px",

        "--mlf-color-bg": "#0a0a0a",
        "--mlf-color-surface": "#121212",
        "--mlf-color-surface-muted": "#1a1a1a",
        "--mlf-color-surface-elevated": "#242424",

        "--mlf-color-text": "#ffffff",
        "--mlf-color-text-muted": "#cccccc",

        "--mlf-color-border": "#2a2a2a",
        "--mlf-color-border-strong": "#3a3a3a",

        "--mlf-color-accent": "#faff69",
        "--mlf-color-accent-hover": "#e6eb52",
        "--mlf-color-accent-soft": "rgba(250, 255, 105, 0.16)",

        "--mlf-color-success": "#22c55e",
        "--mlf-color-warning": "#facc15",
        "--mlf-color-danger": "#ef4444",
        "--mlf-color-danger-soft": "rgba(239, 68, 68, 0.16)",

        "--mlf-color-focus-ring": "rgba(250, 255, 105, 0.42)",
        "--mlf-color-overlay": "rgba(10, 10, 10, 0.86)",
        "--mlf-color-hover-surface": "#242424",
        "--mlf-color-chart-track": "rgba(255, 255, 255, 0.14)",

        "--mlf-color-code-bg": "#1a1a1a",
        "--mlf-color-code-text": "#e6e6e6",
        "--mlf-color-code-muted": "#888888",
        "--mlf-color-info": "#3b82f6",
      },
    },
  },
};
