// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { ThemeManifest } from "../types";

export const m3diseenTheme: ThemeManifest = {
  id: "m3diseen",
  label: "M3DISEEN",
  sharedTokens: {
    "--mlf-font-family-body": '"Quicksand", ui-sans-serif, system-ui, sans-serif',
    "--mlf-font-family-heading": '"Quicksand", ui-sans-serif, system-ui, sans-serif',
    "--mlf-font-family-ui": '"Quicksand", ui-sans-serif, system-ui, sans-serif',
    "--mlf-radius-sm": "6px",
    "--mlf-radius-md": "8px",
    "--mlf-radius-lg": "8px",
    "--mlf-radius-xl": "12px",
    "--mlf-ring-width": "3px",
  },
  schemes: {
    light: {
      colorScheme: "light",
      tokens: {
        "--mlf-color-bg": "#9092c7",
        "--mlf-color-surface": "#ffffff",
        "--mlf-color-surface-muted": "#f3f3f8",
        "--mlf-color-surface-elevated": "#ffffff",
        "--mlf-color-text": "#212529",
        "--mlf-color-text-muted": "#54566c",
        "--mlf-color-text-inverse": "#ffffff",
        "--mlf-color-border": "#d9dae6",
        "--mlf-color-border-strong": "#b9bbce",
        // Keep the original canvas; use its ink shade for readable links and focus.
        "--mlf-color-accent": "#5c5f9e",
        "--mlf-color-accent-hover": "#4b4e86",
        "--mlf-color-accent-soft": "rgba(144, 146, 199, 0.14)",
        "--mlf-color-success": "#246549",
        "--mlf-color-warning": "#805907",
        "--mlf-color-danger": "#a73342",
        "--mlf-color-danger-soft": "rgba(167, 51, 66, 0.08)",
        "--mlf-color-focus-ring": "rgba(116, 120, 185, 0.30)",
        "--mlf-color-overlay": "rgba(243, 243, 248, 0.90)",
        "--mlf-color-hover-surface": "#e9e9f4",
        "--mlf-color-chart-track": "rgba(84, 86, 108, 0.14)",
      },
    },
    dark: {
      colorScheme: "dark",
      tokens: {
        "--mlf-color-bg": "#161722",
        "--mlf-color-surface": "#1e2030",
        "--mlf-color-surface-muted": "#252739",
        "--mlf-color-surface-elevated": "#2c2e42",
        "--mlf-color-text": "#f3f3fa",
        "--mlf-color-text-muted": "#bfc1d7",
        "--mlf-color-text-inverse": "#161722",
        "--mlf-color-border": "#3c3e55",
        "--mlf-color-border-strong": "#555875",
        "--mlf-color-accent": "#b0b3e4",
        "--mlf-color-accent-hover": "#c7c9ef",
        "--mlf-color-accent-soft": "rgba(176, 179, 228, 0.14)",
        "--mlf-color-success": "#80d6a9",
        "--mlf-color-warning": "#efc475",
        "--mlf-color-danger": "#ffa2ad",
        "--mlf-color-danger-soft": "rgba(255, 162, 173, 0.12)",
        "--mlf-color-focus-ring": "rgba(176, 179, 228, 0.30)",
        "--mlf-color-overlay": "rgba(22, 23, 34, 0.90)",
        "--mlf-color-hover-surface": "#383b53",
        "--mlf-color-chart-track": "rgba(191, 193, 215, 0.18)",
      },
    },
  },
};
