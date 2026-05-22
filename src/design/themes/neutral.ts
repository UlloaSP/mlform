// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { neutralLightColorTokens } from "../contract/global-tokens";
import type { ThemeManifest } from "../types";

export const neutralTheme: ThemeManifest = {
  id: "neutral",
  label: "Neutral",
  schemes: {
    light: {
      colorScheme: "light",
      tokens: neutralLightColorTokens,
    },
    dark: {
      colorScheme: "dark",
      tokens: {
        "--mlf-shadow-sm": "0 1px 3px rgba(0, 0, 0, 0.45)",
        "--mlf-shadow-md": "0 14px 30px rgba(0, 0, 0, 0.35)",
        "--mlf-shadow-lg": "0 24px 60px rgba(0, 0, 0, 0.28)",
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
