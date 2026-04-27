// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { contrastRecipe, defaultRecipe, minimalRecipe, softRecipe } from "../recipes";
import { cobaltTheme, graphiteTheme, neutralTheme, sageTheme, sunsetTheme } from "../themes";
import { createDesignSystemRegistry } from "./create-registry";
import type { RecipeManifest, ThemeManifest } from "../types";

export const builtinThemes: ThemeManifest[] = [
  neutralTheme,
  cobaltTheme,
  sageTheme,
  sunsetTheme,
  graphiteTheme,
];

export const builtinRecipes: RecipeManifest[] = [
  defaultRecipe,
  minimalRecipe,
  softRecipe,
  contrastRecipe,
];

export const createBuiltinDesignSystemRegistry = () => {
  const registry = createDesignSystemRegistry();

  for (const theme of builtinThemes) {
    registry.registerTheme(theme);
  }

  for (const recipe of builtinRecipes) {
    registry.registerRecipe(recipe);
  }

  return registry;
};

export const builtinDesignSystemRegistry = createBuiltinDesignSystemRegistry();
