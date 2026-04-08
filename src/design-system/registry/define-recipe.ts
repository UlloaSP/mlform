// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { RecipeManifest } from "../types";

export const defineRecipe = (recipe: RecipeManifest): RecipeManifest => {
  return {
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
  };
};
