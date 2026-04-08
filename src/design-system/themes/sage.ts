// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { ThemeManifest } from "../types";

export const sageTheme: ThemeManifest = {
  id: "sage",
  label: "Sage",
  schemes: {
    light: {
      colorScheme: "light",
      tokens: {
        "--mlf-color-bg": "#f2f6f1",
        "--mlf-color-surface": "#fbfdfb",
        "--mlf-color-surface-muted": "#e8efe6",
        "--mlf-color-surface-elevated": "#ffffff",
        "--mlf-color-text": "#203126",
        "--mlf-color-text-muted": "#5e7264",
        "--mlf-color-border": "#cfdbcf",
        "--mlf-color-border-strong": "#bbccbc",
        "--mlf-color-accent": "#2f7d57",
        "--mlf-color-accent-hover": "#256847",
        "--mlf-color-accent-soft": "rgba(47, 125, 87, 0.12)",
        "--mlf-color-success": "#2d8a57",
        "--mlf-color-warning": "#bd7d29",
        "--mlf-color-danger": "#b94a48",
        "--mlf-color-danger-soft": "rgba(185, 74, 72, 0.12)",
        "--mlf-color-focus-ring": "rgba(47, 125, 87, 0.24)",
        "--mlf-color-overlay": "rgba(251, 253, 251, 0.78)",
        "--mlf-color-hover-surface": "#dde9db",
        "--mlf-color-chart-track": "rgba(32, 49, 38, 0.12)",
      },
    },
    dark: {
      colorScheme: "dark",
      tokens: {
        "--mlf-color-bg": "#121a15",
        "--mlf-color-surface": "#182119",
        "--mlf-color-surface-muted": "#203024",
        "--mlf-color-surface-elevated": "#24372a",
        "--mlf-color-text": "#edf5ef",
        "--mlf-color-text-muted": "#a8b9aa",
        "--mlf-color-border": "#304234",
        "--mlf-color-border-strong": "#3f5544",
        "--mlf-color-accent": "#59b07d",
        "--mlf-color-accent-hover": "#74c492",
        "--mlf-color-accent-soft": "rgba(89, 176, 125, 0.16)",
        "--mlf-color-success": "#67d595",
        "--mlf-color-warning": "#efbb67",
        "--mlf-color-danger": "#ff8e8a",
        "--mlf-color-danger-soft": "rgba(255, 142, 138, 0.14)",
        "--mlf-color-focus-ring": "rgba(89, 176, 125, 0.3)",
        "--mlf-color-overlay": "rgba(18, 26, 21, 0.84)",
        "--mlf-color-hover-surface": "#2a3d30",
        "--mlf-color-chart-track": "rgba(168, 185, 170, 0.18)",
      },
    },
  },
};
