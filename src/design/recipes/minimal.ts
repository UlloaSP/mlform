// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { RecipeManifest } from "../types";

export const minimalRecipe: RecipeManifest = {
  id: "minimal",
  label: "Minimal",
  density: "compact",
  motion: "none",
  tokens: {
    "--mlf-shadow-md": "none",
    "--mlf-shadow-lg": "none",
  },
  components: {
    hero: {
      tokens: {
        "--mlf-hero-bg": "var(--mlf-color-surface)",
        "--mlf-hero-shadow": "none",
      },
    },
    field: {
      tokens: {
        "--mlf-field-bg": "var(--mlf-color-surface)",
        "--mlf-field-shadow": "none",
      },
    },
    report: {
      tokens: {
        "--mlf-report-bg": "var(--mlf-color-surface)",
        "--mlf-report-shadow": "none",
      },
    },
    submit: {
      tokens: {
        "--mlf-submit-shadow": "none",
        "--mlf-submit-shadow-hover": "none",
      },
    },
  },
};
