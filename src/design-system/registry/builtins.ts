// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { builtinRecipes } from "../recipes";
import { builtinThemes } from "../themes";
import { createDesignSystemRegistry } from "./create-registry";

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
