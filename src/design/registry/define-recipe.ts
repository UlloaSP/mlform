// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { RecipeManifest } from "../types";
import { deepFreeze } from "./deep-freeze";

export const defineRecipe = (recipe: RecipeManifest): RecipeManifest => {
  if (!recipe.id?.trim()) {
    throw new Error(`[mlform] RecipeManifest missing or empty "id"`);
  }
  if (!recipe.label?.trim()) {
    throw new Error(`[mlform] Recipe "${recipe.id}" missing or empty "label"`);
  }
  if (!recipe.density) {
    throw new Error(`[mlform] Recipe "${recipe.id}" missing "density"`);
  }
  if (!recipe.motion) {
    throw new Error(`[mlform] Recipe "${recipe.id}" missing "motion"`);
  }

  return deepFreeze({
    ...recipe,
    tokens: recipe.tokens ? { ...recipe.tokens } : undefined,
    components: recipe.components
      ? (Object.fromEntries(
          Object.entries(recipe.components).map(([key, component]) => [
            key,
            component ? { tokens: { ...component.tokens } } : component,
          ]),
        ) as RecipeManifest["components"])
      : undefined,
  });
};
