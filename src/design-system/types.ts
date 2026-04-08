// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { ComponentKey } from "./contract";

export type DesignSystemScheme = "light" | "dark";
export type DesignSystemMode = "light" | "dark" | "auto" | "inherit";
export type Density = "compact" | "comfortable" | "spacious";
export type Motion = "none" | "subtle" | "standard";

export type EffectiveModeSource =
  | "explicit"
  | "system"
  | "host-attribute"
  | "host-style"
  | "host-resolver"
  | "theme-fallback"
  | "default";

export interface ThemeScheme {
  colorScheme?: DesignSystemScheme;
  tokens: Record<string, string>;
}

export interface ThemeManifest {
  id: string;
  label: string;
  schemes: {
    light: ThemeScheme;
    dark?: ThemeScheme;
  };
  sharedTokens?: Record<string, string>;
}

export interface ComponentManifest {
  tokens: Record<string, string>;
}

export interface RecipeManifest {
  id: string;
  label: string;
  density: Density;
  motion: Motion;
  tokens?: Record<string, string>;
  components?: Partial<Record<ComponentKey, ComponentManifest>>;
}

export interface DesignSystemOverrides {
  density?: Density;
  motion?: Motion;
  tokens?: Record<string, string>;
  components?: Partial<Record<ComponentKey, Partial<ComponentManifest>>>;
}

export interface DesignSystemConfig {
  mode?: DesignSystemMode;
  theme?: string | ThemeManifest;
  recipe?: string | RecipeManifest;
  overrides?: DesignSystemOverrides;
  hostSchemeResolver?: (host: HTMLElement) => DesignSystemScheme | null;
}

export interface ResolvedComponentConfig {
  tokens: Record<string, string>;
}

export interface ResolvedDesignSystem {
  requestedMode: DesignSystemMode;
  effectiveScheme: DesignSystemScheme;
  effectiveModeSource: EffectiveModeSource;
  themeId: string;
  recipeId: string;
  density: Density;
  motion: Motion;
  tokens: Record<string, string>;
  tokenOverrides: Record<string, string>;
  components: Record<ComponentKey, ResolvedComponentConfig>;
}

export interface ResolveDesignSystemRuntimeOptions {
  inheritedScheme?: DesignSystemScheme | null;
  inheritedSource?: Extract<EffectiveModeSource, "host-attribute" | "host-style" | "host-resolver">;
  systemScheme?: DesignSystemScheme;
}

export interface DesignSystemRegistry {
  registerTheme(theme: ThemeManifest): DesignSystemRegistry;
  registerRecipe(recipe: RecipeManifest): DesignSystemRegistry;
  getTheme(id: string): ThemeManifest | undefined;
  getRecipe(id: string): RecipeManifest | undefined;
  listThemes(): ThemeManifest[];
  listRecipes(): RecipeManifest[];
  clone(): DesignSystemRegistry;
}

export interface DesignSystemControllerOptions {
  host: HTMLElement;
  registry?: DesignSystemRegistry;
  getConfig: () => DesignSystemConfig;
  onChange?: (resolved: ResolvedDesignSystem) => void;
}

export interface AttachDesignSystemOptions {
  config?: DesignSystemConfig;
  registry?: DesignSystemRegistry;
  onChange?: (resolved: ResolvedDesignSystem) => void;
}

export interface AttachedDesignSystem {
  readonly host: HTMLElement;
  readonly registry: DesignSystemRegistry;
  readonly config: DesignSystemConfig;
  readonly resolved: ResolvedDesignSystem | null;
  update(config: DesignSystemConfig): void;
  replace(config: DesignSystemConfig): void;
  reset(): void;
  disconnect(): void;
}
