// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { RecipeManifest } from "../types";

export const softRecipe: RecipeManifest = {
  id: "soft",
  label: "Soft",
  density: "comfortable",
  motion: "subtle",
  components: {
    hero: {
      tokens: {
        "--mlf-hero-bg":
          "radial-gradient(circle at top left, color-mix(in srgb, var(--mlf-color-accent) 10%, transparent), transparent 42%), linear-gradient(180deg, color-mix(in srgb, var(--mlf-color-surface) 92%, var(--mlf-color-surface-elevated)), color-mix(in srgb, var(--mlf-color-surface-muted) 88%, var(--mlf-color-surface-elevated)))",
      },
    },
    field: {
      tokens: {
        "--mlf-field-bg":
          "linear-gradient(180deg, color-mix(in srgb, var(--mlf-color-surface) 96%, var(--mlf-color-surface-elevated)), color-mix(in srgb, var(--mlf-color-surface-muted) 94%, var(--mlf-color-surface-elevated)))",
      },
    },
    report: {
      tokens: {
        "--mlf-report-bg":
          "linear-gradient(180deg, color-mix(in srgb, var(--mlf-color-surface) 95%, var(--mlf-color-surface-elevated)), color-mix(in srgb, var(--mlf-color-surface-muted) 92%, var(--mlf-color-surface-elevated)))",
      },
    },
  },
};
