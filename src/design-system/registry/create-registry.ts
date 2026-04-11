// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { defineRecipe } from "./define-recipe";
import { defineTheme } from "./define-theme";
import type { DesignSystemRegistry, RecipeManifest, ThemeManifest } from "../types";

class RuntimeDesignSystemRegistry implements DesignSystemRegistry {
  readonly #themes = new Map<string, ThemeManifest>();
  readonly #recipes = new Map<string, RecipeManifest>();

  registerTheme(theme: ThemeManifest): DesignSystemRegistry {
    // defineTheme validates, clones, and deep-freezes — safe to store and share directly.
    this.#themes.set(theme.id, defineTheme(theme));
    return this;
  }

  registerRecipe(recipe: RecipeManifest): DesignSystemRegistry {
    // defineRecipe validates, clones, and deep-freezes — safe to store and share directly.
    this.#recipes.set(recipe.id, defineRecipe(recipe));
    return this;
  }

  removeTheme(id: string): DesignSystemRegistry {
    this.#themes.delete(id);
    return this;
  }

  removeRecipe(id: string): DesignSystemRegistry {
    this.#recipes.delete(id);
    return this;
  }

  getTheme(id: string): ThemeManifest | undefined {
    // Frozen — return direct reference, no clone needed.
    return this.#themes.get(id);
  }

  getRecipe(id: string): RecipeManifest | undefined {
    // Frozen — return direct reference, no clone needed.
    return this.#recipes.get(id);
  }

  listThemes(): ThemeManifest[] {
    return [...this.#themes.values()];
  }

  listRecipes(): RecipeManifest[] {
    return [...this.#recipes.values()];
  }

  clone(): DesignSystemRegistry {
    const next = new RuntimeDesignSystemRegistry();
    // Themes and recipes are frozen — share references directly instead of re-cloning.
    for (const [id, theme] of this.#themes) {
      next.#themes.set(id, theme);
    }
    for (const [id, recipe] of this.#recipes) {
      next.#recipes.set(id, recipe);
    }
    return next;
  }
}

export const createDesignSystemRegistry = (): DesignSystemRegistry => {
  return new RuntimeDesignSystemRegistry();
};
