// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { defineRecipe } from "./define-recipe";
import { defineTheme } from "./define-theme";
import type { DesignSystemRegistry, RecipeManifest, ThemeManifest } from "../types";

class RuntimeDesignSystemRegistry implements DesignSystemRegistry {
  readonly #themes = new Map<string, ThemeManifest>();
  readonly #recipes = new Map<string, RecipeManifest>();

  registerTheme(theme: ThemeManifest): DesignSystemRegistry {
    this.#themes.set(theme.id, defineTheme(theme));
    return this;
  }

  registerRecipe(recipe: RecipeManifest): DesignSystemRegistry {
    this.#recipes.set(recipe.id, defineRecipe(recipe));
    return this;
  }

  getTheme(id: string): ThemeManifest | undefined {
    const theme = this.#themes.get(id);
    return theme ? defineTheme(theme) : undefined;
  }

  getRecipe(id: string): RecipeManifest | undefined {
    const recipe = this.#recipes.get(id);
    return recipe ? defineRecipe(recipe) : undefined;
  }

  listThemes(): ThemeManifest[] {
    return [...this.#themes.values()].map((theme) => defineTheme(theme));
  }

  listRecipes(): RecipeManifest[] {
    return [...this.#recipes.values()].map((recipe) => defineRecipe(recipe));
  }

  clone(): DesignSystemRegistry {
    const next = new RuntimeDesignSystemRegistry();

    for (const theme of this.#themes.values()) {
      next.registerTheme(theme);
    }

    for (const recipe of this.#recipes.values()) {
      next.registerRecipe(recipe);
    }

    return next;
  }
}

export const createDesignSystemRegistry = (): DesignSystemRegistry => {
  return new RuntimeDesignSystemRegistry();
};
