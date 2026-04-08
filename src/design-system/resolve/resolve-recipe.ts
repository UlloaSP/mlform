// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { defaultRecipe } from "../recipes";
import type { DesignSystemConfig, DesignSystemRegistry, RecipeManifest } from "../types";

export const resolveRecipe = (
  config: DesignSystemConfig,
  registry: DesignSystemRegistry,
): RecipeManifest => {
  const requested = config.recipe;

  if (requested && typeof requested !== "string") {
    return requested;
  }

  if (typeof requested === "string") {
    return registry.getRecipe(requested) ?? defaultRecipe;
  }

  return registry.getRecipe("default") ?? defaultRecipe;
};
