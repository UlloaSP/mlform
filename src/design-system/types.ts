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
  | "invalid-theme-variant"
  | "unknown-token-key"
  | "misplaced-component-token"
  | "broken-token-reference";

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

/**
 * A named variant of a base scheme. Variants overlay additional tokens
 * on top of a base scheme's tokens — use for accessibility variants
 * (e.g. `"high-contrast-light"`, `"high-contrast-dark"`) or brand variants.
 */
export interface ThemeVariant {
  /** Which base scheme this variant extends. */
  baseScheme: DesignSystemScheme;
  /** Additional tokens overlaid on the base scheme's tokens. */
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
   * Additional scheme variants that overlay base scheme tokens.
   * Keyed by arbitrary variant names (e.g. `"high-contrast-light"`,
   * `"high-contrast-dark"`). Each variant specifies a `baseScheme` and
   * additional tokens applied on top.
   *
   * When `prefersMoreContrast` is detected and no explicit `variant` is set,
   * the resolver auto-selects `"high-contrast-${effectiveScheme}"` if present.
   */
  variants?: Record<string, ThemeVariant>;
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
  /**
   * Select a named theme variant (e.g. `"high-contrast-light"`). When set,
   * the variant's tokens overlay the resolved base scheme tokens only when the
   * variant's `baseScheme` matches the effective scheme. Mismatches emit an
   * `"invalid-theme-variant"` warning and the variant is ignored.
   *
   * When omitted and `prefersMoreContrast` is active, the resolver
   * auto-selects `"high-contrast-${effectiveScheme}"` if it exists in the theme.
   */
  variant?: string;
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
  /** The active theme variant, or `null` if no variant is applied. */
  variant: string | null;
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
  /** When true and `density` is not explicitly overridden, effective density becomes `"spacious"`. */
  prefersMoreContrast?: boolean;
  /**
   * When true, Windows High Contrast Mode (or equivalent `forced-colors: active`)
   * is active. Color tokens are remapped to CSS system colors so the browser's
   * forced-color palette is respected.
   */
  forcedColors?: boolean;
}

export type DesignSystemRegistryChangeType =
  | "theme-registered"
  | "theme-removed"
  | "recipe-registered"
  | "recipe-removed";

export interface DesignSystemRegistryChangeEvent {
  type: DesignSystemRegistryChangeType;
  id: string;
}

export type DesignSystemRegistryChangeListener = (event: DesignSystemRegistryChangeEvent) => void;

export interface DesignSystemRegistry {
  registerTheme(theme: ThemeManifest): DesignSystemRegistry;
  registerRecipe(recipe: RecipeManifest): DesignSystemRegistry;
  /**
   * Register a variant for an existing theme without re-registering the
   * entire theme. If the theme does not exist yet, the variant is stored
   * and will be attached when the theme is later registered.
   */
  registerVariant(themeId: string, variantId: string, variant: ThemeVariant): DesignSystemRegistry;
  removeTheme(id: string): DesignSystemRegistry;
  removeRecipe(id: string): DesignSystemRegistry;
  getTheme(id: string): ThemeManifest | undefined;
  getRecipe(id: string): RecipeManifest | undefined;
  listThemes(): ThemeManifest[];
  listRecipes(): RecipeManifest[];
  clone(): DesignSystemRegistry;
  onChange(listener: DesignSystemRegistryChangeListener): () => void;
}

/**
 * Strategy for animating design-system transitions (theme/scheme switches).
 *
 * - `"none"` — instant switch (default).
 * - `"view-transition"` — uses the View Transitions API (`document.startViewTransition`)
 *   when available; falls back to instant switch. Stale transitions are ignored
 *   when a newer update supersedes them.
 * - A custom function receives the update callback and is responsible for
 *   calling it (e.g. wrapping in a CSS transition or animation). It may return
 *   cleanup function and should observe `context.signal` for cancellation.
 */
export interface DesignSystemTransitionContext {
  host: HTMLElement;
  resolved: ResolvedDesignSystem;
  previous: ResolvedDesignSystem | null;
  signal: AbortSignal;
}

export type DesignSystemTransition =
  | "none"
  | "view-transition"
  | ((apply: () => void, context: DesignSystemTransitionContext) => void | (() => void));

export interface DesignSystemControllerOptions {
  host: HTMLElement;
  registry?: DesignSystemRegistry;
  getConfig: () => DesignSystemConfig;
  onChange?: (resolved: ResolvedDesignSystem) => void;
  /** When true, seed controller state from matching SSR/inline DOM before first refresh. */
  hydrate?: boolean;
  /**
   * How to animate when the resolved design system changes. Defaults to `"none"`.
   */
  transition?: DesignSystemTransition;
}

export interface AttachDesignSystemOptions {
  config?: DesignSystemConfig;
  registry?: DesignSystemRegistry;
  onChange?: (resolved: ResolvedDesignSystem) => void;
  /** How to animate when the resolved design system changes. Defaults to `"none"`. */
  transition?: DesignSystemTransition;
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
