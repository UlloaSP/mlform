// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { RecipeManifest } from "../types";

export const contrastRecipe: RecipeManifest = {
  id: "contrast",
  label: "Contrast",
  density: "spacious",
  motion: "standard",
  tokens: {
    "--mlf-border-width": "1.5px",
    "--mlf-color-border-strong": "var(--mlf-color-text)",
  },
  components: {
    field: {
      tokens: {
        "--mlf-field-border": "var(--mlf-color-border-strong)",
      },
    },
    report: {
      tokens: {
        "--mlf-report-border": "var(--mlf-color-border-strong)",
      },
    },
    input: {
      tokens: {
        "--mlf-input-border": "var(--mlf-color-border-strong)",
      },
    },
    submit: {
      tokens: {
        "--mlf-submit-radius": "var(--mlf-radius-sm)",
      },
    },
  },
};
