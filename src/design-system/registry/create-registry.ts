// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { defineRecipe } from "./define-recipe";
import { defineTheme } from "./define-theme";
import { deepFreeze } from "./deep-freeze";
import type {
  DesignSystemRegistry,
  DesignSystemRegistryChangeEvent,
  DesignSystemRegistryChangeListener,
  RecipeManifest,
  ThemeManifest,
  ThemeVariant,
} from "../types";

class RuntimeDesignSystemRegistry implements DesignSystemRegistry {
  readonly #themes = new Map<string, ThemeManifest>();
  readonly #recipes = new Map<string, RecipeManifest>();
  /** Variants registered before their parent theme. Flushed on registerTheme. */
  readonly #pendingVariants = new Map<string, Map<string, ThemeVariant>>();
  readonly #listeners = new Set<DesignSystemRegistryChangeListener>();

  #notify(event: DesignSystemRegistryChangeEvent): void {
    for (const listener of this.#listeners) {
      listener(event);
    }
  }

  registerTheme(theme: ThemeManifest): DesignSystemRegistry {
    // defineTheme validates, clones, and deep-freezes — safe to store and share directly.
    let frozen = defineTheme(theme);

    // Flush any pending variants registered before this theme.
    const pending = this.#pendingVariants.get(theme.id);
    if (pending && pending.size > 0) {
      const mergedVariants = { ...frozen.variants };
      for (const [variantId, variant] of pending) {
        mergedVariants[variantId] = variant;
      }
      frozen = deepFreeze({ ...frozen, variants: mergedVariants }) as ThemeManifest;
      this.#pendingVariants.delete(theme.id);
    }

    this.#themes.set(theme.id, frozen);
    this.#notify({ type: "theme-registered", id: theme.id });
    return this;
  }

  registerVariant(themeId: string, variantId: string, variant: ThemeVariant): DesignSystemRegistry {
    const frozenVariant = deepFreeze({
      baseScheme: variant.baseScheme,
      tokens: { ...variant.tokens },
    }) as ThemeVariant;

    const existing = this.#themes.get(themeId);
    if (existing) {
      // Theme already registered — merge variant in and re-freeze.
      const mergedVariants = { ...existing.variants, [variantId]: frozenVariant };
      this.#themes.set(
        themeId,
        deepFreeze({ ...existing, variants: mergedVariants }) as ThemeManifest,
      );
      this.#notify({ type: "theme-registered", id: themeId });
    } else {
      // Theme not yet registered — store as pending.
      if (!this.#pendingVariants.has(themeId)) {
        this.#pendingVariants.set(themeId, new Map());
      }
      this.#pendingVariants.get(themeId)!.set(variantId, frozenVariant);
    }

    return this;
  }

  registerRecipe(recipe: RecipeManifest): DesignSystemRegistry {
    // defineRecipe validates, clones, and deep-freezes — safe to store and share directly.
    this.#recipes.set(recipe.id, defineRecipe(recipe));
    this.#notify({ type: "recipe-registered", id: recipe.id });
    return this;
  }

  removeTheme(id: string): DesignSystemRegistry {
    this.#pendingVariants.delete(id);
    if (this.#themes.delete(id)) {
      this.#notify({ type: "theme-removed", id });
    }
    return this;
  }

  removeRecipe(id: string): DesignSystemRegistry {
    if (this.#recipes.delete(id)) {
      this.#notify({ type: "recipe-removed", id });
    }
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

  onChange(listener: DesignSystemRegistryChangeListener): () => void {
    this.#listeners.add(listener);
    return () => {
      this.#listeners.delete(listener);
    };
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
    // Clone pending variants (frozen — share references).
    for (const [themeId, variants] of this.#pendingVariants) {
      next.#pendingVariants.set(themeId, new Map(variants));
    }
    // Listeners are NOT cloned — each registry instance has its own subscribers.
    return next;
  }
}

export const createDesignSystemRegistry = (): DesignSystemRegistry => {
  return new RuntimeDesignSystemRegistry();
};
