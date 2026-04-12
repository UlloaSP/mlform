// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { builtinDesignSystemRegistry } from "../registry";
import {
  designSystemAncestorObservedAttributeFilter,
  designSystemEventNames,
  designSystemHostAttributeNames,
  designSystemHostObservedAttributeFilter,
  designSystemMediaQueries,
} from "../constants";
import { resolveDesignSystem } from "../resolve";
import type {
  DesignSystemConfig,
  DesignSystemControllerOptions,
  DesignSystemRegistry,
  DesignSystemScheme,
  DesignSystemTransitionContext,
  DesignSystemTransition,
  EffectiveModeSource,
  RecipeManifest,
  ResolvedDesignSystem,
  ThemeManifest,
} from "../types";
import {
  createResolvedDesignSystemSignature,
  getResolvedDesignSystemHostAttributes,
} from "./host-state";

/**
 * Build a stable fingerprint for config + inline manifests. It is cheaper than
 * full token resolution, but detailed enough to catch inline theme/recipe edits
 * that keep the same ids.
 */
const serializeStringMap = (record: Record<string, string> | undefined): string => {
  if (!record) {
    return "";
  }

  return Object.entries(record)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}:${value}`)
    .join(",");
};

const serializeTheme = (theme: ThemeManifest): string => {
  const variants = Object.entries(theme.variants ?? {})
    .sort(([left], [right]) => left.localeCompare(right))
    .map(
      ([variantId, variant]) =>
        `${variantId}:${variant.baseScheme}:${serializeStringMap(variant.tokens)}`,
    )
    .join(";");

  return [
    theme.id,
    theme.label,
    theme.schemes.light.colorScheme ?? "",
    serializeStringMap(theme.schemes.light.tokens),
    theme.schemes.dark?.colorScheme ?? "",
    serializeStringMap(theme.schemes.dark?.tokens),
    serializeStringMap(theme.sharedTokens),
    variants,
  ].join("|");
};

const serializeRecipe = (recipe: RecipeManifest): string => {
  const components = Object.entries(recipe.components ?? {})
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([componentKey, component]) => `${componentKey}:${serializeStringMap(component?.tokens)}`)
    .join(";");

  return [
    recipe.id,
    recipe.label,
    recipe.density,
    recipe.motion,
    serializeStringMap(recipe.tokens),
    components,
  ].join("|");
};

const fingerprintConfig = (config: DesignSystemConfig): string => {
  const themeKey =
    typeof config.theme === "string"
      ? `ref:${config.theme}`
      : config.theme
        ? `inline:${serializeTheme(config.theme)}`
        : "";
  const recipeKey =
    typeof config.recipe === "string"
      ? `ref:${config.recipe}`
      : config.recipe
        ? `inline:${serializeRecipe(config.recipe)}`
        : "";
  const overrides = config.overrides;
  const overrideTokens = serializeStringMap(overrides?.tokens);
  // Include per-component token keys+values so changing a component token value
  // within the same key set correctly invalidates the snapshot.
  const componentFingerprint = Object.entries(overrides?.components ?? {})
    .sort(([left], [right]) => left.localeCompare(right))
    .filter(([, component]) => Boolean(component?.tokens))
    .map(([key, component]) => `${key}:${serializeStringMap(component!.tokens)}`)
    .join(";");

  return `${config.mode ?? ""}|${themeKey}|${recipeKey}|${config.variant ?? ""}|${config.strict ?? ""}|${overrides?.density ?? ""}|${overrides?.motion ?? ""}|${overrideTokens}|${componentFingerprint}`;
};

const fingerprintEnvironment = (
  config: DesignSystemConfig,
  media: {
    prefersDarkScheme: boolean;
    prefersReducedMotion: boolean;
    prefersMoreContrast: boolean;
    forcedColors: boolean;
  },
): string => {
  return `${media.prefersDarkScheme}|${media.prefersReducedMotion}|${media.prefersMoreContrast}|${media.forcedColors}|${fingerprintConfig(config)}`;
};

import {
  applyResolvedDesignSystem,
  managedDesignSystemAttributes,
  restoreManagedDesignSystem,
} from "./apply-tokens";

type MediaQueryListWithLegacy = MediaQueryList & {
  addListener?: (callback: (event: MediaQueryListEvent) => void) => void;
  removeListener?: (callback: (event: MediaQueryListEvent) => void) => void;
};

const normalizeScheme = (value: string | null | undefined): DesignSystemScheme | null => {
  if (!value) {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === "light" || normalized === "dark") {
    return normalized;
  }

  return null;
};

const addMediaListener = (mql: MediaQueryListWithLegacy, fn: () => void): void => {
  if (typeof mql.addEventListener === "function") {
    mql.addEventListener("change", fn);
  } else {
    mql.addListener?.(fn);
  }
};

const removeMediaListener = (mql: MediaQueryListWithLegacy, fn: () => void): void => {
  if (typeof mql.removeEventListener === "function") {
    mql.removeEventListener("change", fn);
  } else {
    mql.removeListener?.(fn);
  }
};

export class DesignSystemController {
  readonly #host: HTMLElement;
  readonly #registry: DesignSystemRegistry;
  readonly #getConfig: () => DesignSystemConfig;
  readonly #onChange?: (resolved: ResolvedDesignSystem) => void;
  readonly #schemeMediaQuery: MediaQueryListWithLegacy | null;
  readonly #schemeMediaListener: () => void;
  readonly #motionMediaQuery: MediaQueryListWithLegacy | null;
  readonly #motionMediaListener: () => void;
  readonly #contrastMediaQuery: MediaQueryListWithLegacy | null;
  readonly #contrastMediaListener: () => void;
  readonly #forcedColorsMediaQuery: MediaQueryListWithLegacy | null;
  readonly #forcedColorsMediaListener: () => void;
  readonly #hydrateOnConnect: boolean;
  readonly #transition: DesignSystemTransition;
  readonly #mutationObserver: MutationObserver | null;
  readonly #unsubscribeRegistry: (() => void) | null;
  readonly #observedNodes = new Set<Node>();
  readonly #originalAttributes = new Map<string, string | null>();
  readonly #originalTokenValues = new Map<string, string | null>();
  readonly #originalColorScheme: string | null;
  #appliedTokens = new Set<string>();
  #connected = false;
  #signature = "";
  #transitionAbortController: AbortController | null = null;
  #transitionCleanup: (() => void) | null = null;
  /** Snapshot of config + media states — used to skip full resolution on no-ops. */
  #envSnapshot = "";
  #resolved: ResolvedDesignSystem | null = null;

  constructor({
    host,
    registry,
    getConfig,
    onChange,
    transition,
    hydrate,
  }: DesignSystemControllerOptions) {
    this.#host = host;
    this.#registry = registry ?? builtinDesignSystemRegistry;
    this.#getConfig = getConfig;
    this.#onChange = onChange;
    this.#transition = transition ?? "none";
    this.#hydrateOnConnect = hydrate ?? false;
    this.#originalColorScheme = host.style.colorScheme || null;

    const hasMQ = typeof window !== "undefined" && typeof window.matchMedia === "function";

    this.#schemeMediaQuery = hasMQ
      ? (window.matchMedia(designSystemMediaQueries.prefersDarkScheme) as MediaQueryListWithLegacy)
      : null;
    this.#motionMediaQuery = hasMQ
      ? (window.matchMedia(
          designSystemMediaQueries.prefersReducedMotion,
        ) as MediaQueryListWithLegacy)
      : null;
    this.#contrastMediaQuery = hasMQ
      ? (window.matchMedia(
          designSystemMediaQueries.prefersMoreContrast,
        ) as MediaQueryListWithLegacy)
      : null;
    this.#forcedColorsMediaQuery = hasMQ
      ? (window.matchMedia(designSystemMediaQueries.forcedColors) as MediaQueryListWithLegacy)
      : null;

    this.#schemeMediaListener = () => this.refresh();
    this.#motionMediaListener = () => this.refresh();
    this.#contrastMediaListener = () => this.refresh();
    this.#forcedColorsMediaListener = () => this.refresh();

    this.#mutationObserver =
      typeof MutationObserver !== "undefined" ? new MutationObserver(() => this.refresh()) : null;

    // Auto-refresh when registry entries change (theme/recipe add/remove).
    // Force-clear signature so next refresh always re-resolves.
    this.#unsubscribeRegistry = this.#registry.onChange(() => {
      this.#signature = "";
      this.#envSnapshot = "";
      this.refresh();
    });

    for (const attribute of managedDesignSystemAttributes) {
      this.#originalAttributes.set(attribute, host.getAttribute(attribute));
    }
  }

  get resolved(): ResolvedDesignSystem | null {
    return this.#resolved;
  }

  connect(): void {
    if (this.#connected) {
      return;
    }

    this.#connected = true;

    if (this.#schemeMediaQuery) {
      addMediaListener(this.#schemeMediaQuery, this.#schemeMediaListener);
    }
    if (this.#motionMediaQuery) {
      addMediaListener(this.#motionMediaQuery, this.#motionMediaListener);
    }
    if (this.#contrastMediaQuery) {
      addMediaListener(this.#contrastMediaQuery, this.#contrastMediaListener);
    }
    if (this.#forcedColorsMediaQuery) {
      addMediaListener(this.#forcedColorsMediaQuery, this.#forcedColorsMediaListener);
    }

    this.#observeHostChain();
    if (this.#hydrateOnConnect && this.#seedHydratedState()) {
      return;
    }
    this.refresh();
  }

  disconnect(): void {
    if (!this.#connected) {
      return;
    }

    this.#connected = false;

    if (this.#schemeMediaQuery) {
      removeMediaListener(this.#schemeMediaQuery, this.#schemeMediaListener);
    }
    if (this.#motionMediaQuery) {
      removeMediaListener(this.#motionMediaQuery, this.#motionMediaListener);
    }
    if (this.#contrastMediaQuery) {
      removeMediaListener(this.#contrastMediaQuery, this.#contrastMediaListener);
    }
    if (this.#forcedColorsMediaQuery) {
      removeMediaListener(this.#forcedColorsMediaQuery, this.#forcedColorsMediaListener);
    }

    this.#cancelPendingTransition();
    this.#mutationObserver?.disconnect();
    this.#unsubscribeRegistry?.();
    this.#observedNodes.clear();
    restoreManagedDesignSystem(
      this.#host,
      this.#appliedTokens,
      this.#originalAttributes,
      this.#originalTokenValues,
      this.#originalColorScheme,
    );
    this.#appliedTokens.clear();
    this.#signature = "";
    this.#envSnapshot = "";
    this.#resolved = null;
  }

  refresh(): void {
    if (!this.#connected) {
      return;
    }

    this.#observeHostChain();

    const config = this.#getConfig();
    const media = this.#getMediaSnapshot();

    // Lightweight pre-check: for non-inherit modes, skip full token resolution when
    // config and media states haven't changed. "inherit" mode always runs because
    // the inherited scheme requires a DOM walk that can't be pre-checked cheaply.
    const envSnapshot = fingerprintEnvironment(config, media);
    if (envSnapshot === this.#envSnapshot && (config.mode ?? "auto") !== "inherit") {
      return;
    }

    const inherited = this.#resolveInheritedScheme();
    const resolved = resolveDesignSystem(config, this.#registry, {
      inheritedScheme: inherited.scheme,
      inheritedSource: inherited.source ?? undefined,
      systemScheme: media.prefersDarkScheme ? "dark" : "light",
      prefersReducedMotion: media.prefersReducedMotion,
      prefersMoreContrast: media.prefersMoreContrast,
      forcedColors: media.forcedColors,
    });

    const signature = createResolvedDesignSystemSignature(resolved);

    this.#envSnapshot = envSnapshot;

    if (signature === this.#signature) {
      return;
    }

    const previousResolved = this.#resolved;
    this.#signature = signature;
    this.#resolved = resolved;

    const applyDomUpdate = (): void => {
      this.#captureOriginalTokenValues(resolved.tokens);
      this.#restoreRemovedTokenValues(resolved.tokens);
      this.#appliedTokens = applyResolvedDesignSystem(this.#host, resolved, this.#transition);
      this.#onChange?.(resolved);
      this.#host.dispatchEvent(
        new CustomEvent(designSystemEventNames.change, {
          detail: { designSystem: resolved },
          bubbles: true,
          composed: true,
        }),
      );
    };

    this.#applyWithTransition(applyDomUpdate, resolved, previousResolved);
  }

  #applyWithTransition(
    apply: () => void,
    resolved: ResolvedDesignSystem,
    previous: ResolvedDesignSystem | null,
  ): void {
    this.#cancelPendingTransition();
    const abortController = new AbortController();
    this.#transitionAbortController = abortController;

    if (this.#transition === "none") {
      if (!abortController.signal.aborted) {
        apply();
      }
      this.#transitionAbortController = null;
      return;
    }

    if (this.#transition === "view-transition") {
      const doc = this.#host.ownerDocument;
      const applyIfCurrent = (): void => {
        if (abortController.signal.aborted) {
          return;
        }
        apply();
        if (this.#transitionAbortController === abortController) {
          this.#transitionAbortController = null;
        }
      };
      if (
        doc &&
        typeof (doc as unknown as Record<string, unknown>).startViewTransition === "function"
      ) {
        (doc as unknown as { startViewTransition: (cb: () => void) => void }).startViewTransition(
          applyIfCurrent,
        );
      } else {
        applyIfCurrent();
      }
      return;
    }

    const context: DesignSystemTransitionContext = {
      host: this.#host,
      resolved,
      previous,
      signal: abortController.signal,
    };

    const cleanup = this.#transition(() => {
      if (abortController.signal.aborted) {
        return;
      }
      apply();
      if (this.#transitionAbortController === abortController) {
        this.#transitionAbortController = null;
      }
    }, context);

    this.#transitionCleanup = typeof cleanup === "function" ? cleanup : null;
  }

  #resolveInheritedScheme(): {
    scheme: DesignSystemScheme | null;
    source: Extract<EffectiveModeSource, "host-attribute" | "host-style" | "host-resolver"> | null;
  } {
    const config = this.#getConfig();
    const requestedMode = config.mode ?? "auto";

    if (requestedMode !== "inherit") {
      return { scheme: null, source: null };
    }

    if (config.hostSchemeResolver) {
      const resolvedScheme = config.hostSchemeResolver(this.#host);
      if (resolvedScheme) {
        return { scheme: resolvedScheme, source: "host-resolver" };
      }
    }

    const explicitSelf = normalizeScheme(
      this.#host.getAttribute(designSystemHostAttributeNames.explicitScheme),
    );
    if (explicitSelf) {
      return { scheme: explicitSelf, source: "host-attribute" };
    }

    let current: HTMLElement | null = this.#host.parentElement;
    while (current) {
      const explicit =
        normalizeScheme(current.getAttribute(designSystemHostAttributeNames.inheritedScheme)) ??
        normalizeScheme(current.getAttribute(designSystemHostAttributeNames.effectiveScheme)) ??
        normalizeScheme(current.getAttribute(designSystemHostAttributeNames.explicitScheme));
      if (explicit) {
        return { scheme: explicit, source: "host-attribute" };
      }
      current = current.parentElement;
    }

    if (typeof window === "undefined") {
      return { scheme: null, source: null };
    }

    const computedColorScheme = window.getComputedStyle(this.#host).colorScheme;
    if (computedColorScheme.includes("dark")) {
      return { scheme: "dark", source: "host-style" };
    }
    if (computedColorScheme.includes("light")) {
      return { scheme: "light", source: "host-style" };
    }

    return { scheme: null, source: null };
  }

  #observeHostChain(): void {
    if (!this.#mutationObserver) {
      return;
    }

    // Build the current ancestor chain.
    const chain: Node[] = [this.#host];
    let current: HTMLElement | null = this.#host.parentElement;
    while (current) {
      chain.push(current);
      current = current.parentElement;
    }

    // Skip reconnect when the chain hasn't changed — avoids unnecessary
    // disconnect/observe churn on every attribute-triggered refresh.
    if (
      chain.length === this.#observedNodes.size &&
      chain.every((node) => this.#observedNodes.has(node))
    ) {
      return;
    }

    this.#mutationObserver.disconnect();
    this.#observedNodes.clear();

    // Host: narrow filter — only observe externally-set scheme attribute.
    // Excludes `style` and our own `data-mlf-*` writes to prevent self-triggering
    // the observer on every applyResolvedDesignSystem call.
    this.#observedNodes.add(this.#host);
    this.#mutationObserver.observe(this.#host, {
      attributes: true,
      childList: false,
      subtree: false,
      attributeFilter: [...designSystemHostObservedAttributeFilter],
    });

    // Ancestors: full filter for inherited scheme detection.
    let curr: HTMLElement | null = this.#host.parentElement;
    while (curr) {
      this.#observeNode(curr, true);
      curr = curr.parentElement;
    }
  }

  #observeNode(node: Node, observeChildList: boolean): void {
    if (!this.#mutationObserver || this.#observedNodes.has(node)) {
      return;
    }

    this.#observedNodes.add(node);
    this.#mutationObserver.observe(node, {
      attributes: true,
      childList: observeChildList,
      subtree: false,
      attributeFilter: [...designSystemAncestorObservedAttributeFilter],
    });
  }

  #captureOriginalTokenValues(tokens: Record<string, string>): void {
    for (const token of Object.keys(tokens)) {
      if (this.#originalTokenValues.has(token)) {
        continue;
      }

      const value = this.#host.style.getPropertyValue(token);
      this.#originalTokenValues.set(token, value === "" ? null : value);
    }
  }

  #restoreRemovedTokenValues(tokens: Record<string, string>): void {
    const nextTokens = new Set(Object.keys(tokens));

    for (const token of this.#appliedTokens) {
      if (nextTokens.has(token)) {
        continue;
      }

      const originalValue = this.#originalTokenValues.get(token) ?? null;
      if (originalValue === null) {
        this.#host.style.removeProperty(token);
      } else {
        this.#host.style.setProperty(token, originalValue);
      }
    }
  }

  #getMediaSnapshot(): {
    prefersDarkScheme: boolean;
    prefersReducedMotion: boolean;
    prefersMoreContrast: boolean;
    forcedColors: boolean;
  } {
    return {
      prefersDarkScheme: this.#schemeMediaQuery?.matches ?? false,
      prefersReducedMotion: this.#motionMediaQuery?.matches ?? false,
      prefersMoreContrast: this.#contrastMediaQuery?.matches ?? false,
      forcedColors: this.#forcedColorsMediaQuery?.matches ?? false,
    };
  }

  #seedHydratedState(): boolean {
    const config = this.#getConfig();
    const media = this.#getMediaSnapshot();
    const inherited = this.#resolveInheritedScheme();
    const resolved = resolveDesignSystem(config, this.#registry, {
      inheritedScheme: inherited.scheme,
      inheritedSource: inherited.source ?? undefined,
      systemScheme: media.prefersDarkScheme ? "dark" : "light",
      prefersReducedMotion: media.prefersReducedMotion,
      prefersMoreContrast: media.prefersMoreContrast,
      forcedColors: media.forcedColors,
    });

    if (!this.#hostMatchesResolved(resolved)) {
      return false;
    }

    this.#captureOriginalTokenValues(resolved.tokens);
    this.#appliedTokens = new Set(Object.keys(resolved.tokens));
    this.#resolved = resolved;
    this.#signature = createResolvedDesignSystemSignature(resolved);
    this.#envSnapshot = fingerprintEnvironment(config, media);
    return true;
  }

  #hostMatchesResolved(resolved: ResolvedDesignSystem): boolean {
    const expectedAttributes = getResolvedDesignSystemHostAttributes(resolved);
    for (const attribute of managedDesignSystemAttributes) {
      const expected = expectedAttributes[attribute];
      if (expected === undefined) {
        if (this.#host.hasAttribute(attribute)) {
          return false;
        }
        continue;
      }

      if (this.#host.getAttribute(attribute) !== expected) {
        return false;
      }
    }

    if (
      this.#host.getAttribute(designSystemHostAttributeNames.signature) ===
      expectedAttributes[designSystemHostAttributeNames.signature]
    ) {
      return true;
    }

    if (this.#host.style.colorScheme !== resolved.effectiveScheme) {
      return false;
    }

    const inlineTokens = new Map<string, string>();
    for (let index = 0; index < this.#host.style.length; index += 1) {
      const property = this.#host.style.item(index);
      if (!property.startsWith("--mlf-")) {
        continue;
      }
      inlineTokens.set(property, this.#host.style.getPropertyValue(property).trim());
    }

    const resolvedEntries = Object.entries(resolved.tokens);
    if (inlineTokens.size === resolvedEntries.length) {
      for (const [token, value] of resolvedEntries) {
        if (inlineTokens.get(token) !== value) {
          return false;
        }
      }
      return true;
    }

    if (typeof window === "undefined") {
      return false;
    }

    const computed = window.getComputedStyle(this.#host);
    for (const [token, value] of resolvedEntries) {
      if (computed.getPropertyValue(token).trim() !== value) {
        return false;
      }
    }

    return true;
  }

  #cancelPendingTransition(): void {
    this.#transitionAbortController?.abort();
    this.#transitionAbortController = null;
    this.#transitionCleanup?.();
    this.#transitionCleanup = null;
  }
}
