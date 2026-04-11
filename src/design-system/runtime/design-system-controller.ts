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
  EffectiveModeSource,
  ResolvedDesignSystem,
} from "../types";
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
  readonly #mutationObserver: MutationObserver | null;
  readonly #observedNodes = new Set<Node>();
  readonly #originalAttributes = new Map<string, string | null>();
  readonly #originalTokenValues = new Map<string, string | null>();
  readonly #originalColorScheme: string | null;
  #appliedTokens = new Set<string>();
  #connected = false;
  #signature = "";
  /** Snapshot of config + media states — used to skip full resolution on no-ops. */
  #envSnapshot = "";
  #resolved: ResolvedDesignSystem | null = null;

  constructor({ host, registry, getConfig, onChange }: DesignSystemControllerOptions) {
    this.#host = host;
    this.#registry = registry ?? builtinDesignSystemRegistry;
    this.#getConfig = getConfig;
    this.#onChange = onChange;
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

    this.#schemeMediaListener = () => this.refresh();
    this.#motionMediaListener = () => this.refresh();

    this.#mutationObserver =
      typeof MutationObserver !== "undefined" ? new MutationObserver(() => this.refresh()) : null;

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

    this.#observeHostChain();
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

    this.#mutationObserver?.disconnect();
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

    // Lightweight pre-check: for non-inherit modes, skip full token resolution when
    // config and media states haven't changed. "inherit" mode always runs because
    // the inherited scheme requires a DOM walk that can't be pre-checked cheaply.
    const envSnapshot = `${this.#schemeMediaQuery?.matches ?? false}|${this.#motionMediaQuery?.matches ?? false}|${JSON.stringify(config)}`;
    if (envSnapshot === this.#envSnapshot && (config.mode ?? "auto") !== "inherit") {
      return;
    }

    const inherited = this.#resolveInheritedScheme();
    const resolved = resolveDesignSystem(config, this.#registry, {
      inheritedScheme: inherited.scheme,
      inheritedSource: inherited.source ?? undefined,
      systemScheme: this.#schemeMediaQuery?.matches ? "dark" : "light",
      prefersReducedMotion: this.#motionMediaQuery?.matches ?? false,
    });

    // Lightweight fingerprint: themeId+recipeId+scheme+density+motion uniquely determine
    // the token output (registry entries are frozen), so we avoid serializing the full
    // token map. Only tokenOverrides needs serialization because it's user-provided.
    const signature = [
      resolved.requestedMode,
      resolved.effectiveScheme,
      resolved.effectiveModeSource,
      resolved.themeId,
      resolved.recipeId,
      resolved.density,
      resolved.motion,
      JSON.stringify(resolved.tokenOverrides),
    ].join("|");

    this.#envSnapshot = envSnapshot;

    if (signature === this.#signature) {
      return;
    }

    this.#signature = signature;
    this.#resolved = resolved;
    this.#captureOriginalTokenValues(resolved.tokens);
    this.#restoreRemovedTokenValues(resolved.tokens);
    this.#appliedTokens = applyResolvedDesignSystem(this.#host, resolved);
    this.#onChange?.(resolved);
    this.#host.dispatchEvent(
      new CustomEvent(designSystemEventNames.change, {
        detail: { designSystem: resolved },
        bubbles: true,
        composed: true,
      }),
    );
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
}
