// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { ComponentKey, MlfTokenKey } from "./contract";

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

export type DesignSystemWarningCode =
  | "unknown-theme-id"
  | "unknown-recipe-id"
  | "unknown-token-key"
  | "misplaced-component-token";

export interface DesignSystemWarning {
  code: DesignSystemWarningCode;
  message: string;
  path?: string;
  value?: string;
}

/**
 * Utility type for token maps with IDE autocompletion for all `--mlf-*` keys.
 *
 * Use this when authoring custom themes, recipes, or overrides to get
 * completion suggestions and catch typos in token key names. Structurally
 * compatible with `Record<string, string>` — accepts any CSS custom property.
 *
 * ```ts
 * const myTheme: ThemeManifest = {
 *   id: "brand",
 *   label: "Brand",
 *   schemes: {
 *     light: {
 *       tokens: {
 *         "--mlf-color-accent": "#c0392b",  // ← autocomplete + typo detection
 *       } satisfies Partial<TokenMap>,
 *     },
 *   },
 * };
 * ```
 */
export type TokenMap = Partial<Record<MlfTokenKey, string>> & { [key: string]: string };
export type ComponentTokenKey<K extends ComponentKey = ComponentKey> = `--mlf-${K}-${string}`;
export type GlobalTokenKey = Exclude<MlfTokenKey, ComponentTokenKey>;
export type GlobalTokenMap = Partial<Record<GlobalTokenKey, string>>;
export type ComponentTokenMap<K extends ComponentKey> = Partial<
  Record<ComponentTokenKey<K>, string>
>;

export interface ThemeScheme {
  /**
   * Informational — declares the intended scheme for this slot.
   * Does NOT affect scheme resolution; the resolved scheme is determined
   * by `mode`, the media query, or parent inheritance.
   */
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
  /**
   * Tokens applied to both schemes before scheme-specific tokens.
   * Use for values that don't change between light and dark (e.g. brand fonts,
   * static radii). Scheme tokens win over `sharedTokens` when keys collide.
   */
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
  strict?: boolean;
  onWarning?: (warning: DesignSystemWarning) => void;
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
  warnings: DesignSystemWarning[];
}

export interface ResolveDesignSystemRuntimeOptions {
  inheritedScheme?: DesignSystemScheme | null;
  inheritedSource?: Extract<EffectiveModeSource, "host-attribute" | "host-style" | "host-resolver">;
  systemScheme?: DesignSystemScheme;
  /** When true and `motion` is not explicitly overridden, effective motion collapses to `"none"`. */
  prefersReducedMotion?: boolean;
}

export interface DesignSystemRegistry {
  registerTheme(theme: ThemeManifest): DesignSystemRegistry;
  registerRecipe(recipe: RecipeManifest): DesignSystemRegistry;
  removeTheme(id: string): DesignSystemRegistry;
  removeRecipe(id: string): DesignSystemRegistry;
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
