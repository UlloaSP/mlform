// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { RecipeManifest } from "../types";

export const defaultRecipe: RecipeManifest = {
  id: "default",
  label: "Default",
  density: "comfortable",
  motion: "subtle",
  tokens: {
    "--mlf-shell-bg": "transparent",
  },
};
