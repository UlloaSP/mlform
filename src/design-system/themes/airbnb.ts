// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { ThemeManifest } from "../types";

export const airbnbTheme: ThemeManifest = {
  id: "airbnb",
  label: "Airbnb",
  schemes: {
    light: {
      colorScheme: "light",
      tokens: {
        "--mlf-font-family":
          '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',

        "--mlf-shadow-sm":
          "rgba(0, 0, 0, 0.02) 0px 0px 0px 1px, rgba(0, 0, 0, 0.04) 0px 2px 6px, rgba(0, 0, 0, 0.10) 0px 4px 8px",
        "--mlf-shadow-md": "rgba(0, 0, 0, 0.08) 0px 4px 12px",
        "--mlf-shadow-lg": "rgba(0, 0, 0, 0.10) 0px 8px 24px, rgba(0, 0, 0, 0.06) 0px 2px 8px",

        "--mlf-radius-sm": "8px",
        "--mlf-radius-md": "14px",
        "--mlf-radius-lg": "20px",
        "--mlf-radius-xl": "32px",
        "--mlf-radius-full": "9999px",

        "--mlf-color-bg": "#ffffff",
        "--mlf-color-surface": "#ffffff",
        "--mlf-color-surface-muted": "#f7f7f7",
        "--mlf-color-surface-elevated": "#ffffff",

        "--mlf-color-text": "#222222",
        "--mlf-color-text-muted": "#6a6a6a",

        "--mlf-color-border": "#dddddd",
        "--mlf-color-border-strong": "#c1c1c1",

        "--mlf-color-accent": "#ff385c",
        "--mlf-color-accent-hover": "#e00b41",
        "--mlf-color-accent-soft": "rgba(255, 56, 92, 0.12)",

        "--mlf-color-success": "#008a05",
        "--mlf-color-warning": "#b26a00",
        "--mlf-color-danger": "#c13515",
        "--mlf-color-danger-soft": "rgba(193, 53, 21, 0.12)",

        "--mlf-color-focus-ring": "rgba(34, 34, 34, 0.24)",
        "--mlf-color-overlay": "rgba(255, 255, 255, 0.82)",
        "--mlf-color-hover-surface": "#f2f2f2",
        "--mlf-color-chart-track": "rgba(34, 34, 34, 0.12)",

        "--mlf-color-premium-luxe": "#460479",
        "--mlf-color-premium-plus": "#92174d",
        "--mlf-color-legal": "#428bff",
      },
    },
    dark: {
      colorScheme: "dark",
      tokens: {
        "--mlf-font-family":
          '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',

        "--mlf-shadow-sm":
          "rgba(0, 0, 0, 0.36) 0px 0px 0px 1px, rgba(0, 0, 0, 0.32) 0px 2px 6px, rgba(0, 0, 0, 0.42) 0px 4px 8px",
        "--mlf-shadow-md": "rgba(0, 0, 0, 0.38) 0px 6px 18px",
        "--mlf-shadow-lg": "rgba(0, 0, 0, 0.44) 0px 16px 42px, rgba(0, 0, 0, 0.30) 0px 4px 14px",

        "--mlf-radius-sm": "8px",
        "--mlf-radius-md": "14px",
        "--mlf-radius-lg": "20px",
        "--mlf-radius-xl": "32px",
        "--mlf-radius-full": "9999px",

        "--mlf-color-bg": "#121212",
        "--mlf-color-surface": "#1c1c1c",
        "--mlf-color-surface-muted": "#262626",
        "--mlf-color-surface-elevated": "#2b2b2b",

        "--mlf-color-text": "#f7f7f7",
        "--mlf-color-text-muted": "#b0b0b0",

        "--mlf-color-border": "#3a3a3a",
        "--mlf-color-border-strong": "#505050",

        "--mlf-color-accent": "#ff385c",
        "--mlf-color-accent-hover": "#ff5a75",
        "--mlf-color-accent-soft": "rgba(255, 56, 92, 0.18)",

        "--mlf-color-success": "#2fbd59",
        "--mlf-color-warning": "#ffb340",
        "--mlf-color-danger": "#ff6b5f",
        "--mlf-color-danger-soft": "rgba(255, 107, 95, 0.16)",

        "--mlf-color-focus-ring": "rgba(255, 56, 92, 0.34)",
        "--mlf-color-overlay": "rgba(18, 18, 18, 0.84)",
        "--mlf-color-hover-surface": "#333333",
        "--mlf-color-chart-track": "rgba(247, 247, 247, 0.14)",

        "--mlf-color-premium-luxe": "#b26bff",
        "--mlf-color-premium-plus": "#ff6bb0",
        "--mlf-color-legal": "#7aa7ff",
      },
    },
  },
};
