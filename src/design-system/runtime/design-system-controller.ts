// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { builtinDesignSystemRegistry } from "../registry";
import {
  designSystemEventNames,
  designSystemHostAttributeNames,
  designSystemMediaQueries,
  designSystemObservedAttributeFilter,
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

export class DesignSystemController {
  readonly #host: HTMLElement;
  readonly #registry: DesignSystemRegistry;
  readonly #getConfig: () => DesignSystemConfig;
  readonly #onChange?: (resolved: ResolvedDesignSystem) => void;
  readonly #mediaQuery: MediaQueryListWithLegacy | null;
  readonly #mediaListener: () => void;
  readonly #mutationObserver: MutationObserver | null;
  readonly #observedNodes = new Set<Node>();
  readonly #originalAttributes = new Map<string, string | null>();
  readonly #originalTokenValues = new Map<string, string | null>();
  readonly #originalColorScheme: string | null;
  #appliedTokens = new Set<string>();
  #connected = false;
  #signature = "";
  #resolved: ResolvedDesignSystem | null = null;

  constructor({ host, registry, getConfig, onChange }: DesignSystemControllerOptions) {
    this.#host = host;
    this.#registry = registry ?? builtinDesignSystemRegistry;
    this.#getConfig = getConfig;
    this.#onChange = onChange;
    this.#originalColorScheme = host.style.colorScheme || null;
    this.#mediaQuery =
      typeof window !== "undefined" && typeof window.matchMedia === "function"
        ? (window.matchMedia(
            designSystemMediaQueries.prefersDarkScheme,
          ) as MediaQueryListWithLegacy)
        : null;
    this.#mediaListener = () => this.refresh();
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
    if (this.#mediaQuery) {
      if (typeof this.#mediaQuery.addEventListener === "function") {
        this.#mediaQuery.addEventListener("change", this.#mediaListener);
      } else {
        this.#mediaQuery.addListener?.(this.#mediaListener);
      }
    }

    this.#observeHostChain();
    this.refresh();
  }

  disconnect(): void {
    if (!this.#connected) {
      return;
    }

    this.#connected = false;
    if (this.#mediaQuery) {
      if (typeof this.#mediaQuery.removeEventListener === "function") {
        this.#mediaQuery.removeEventListener("change", this.#mediaListener);
      } else {
        this.#mediaQuery.removeListener?.(this.#mediaListener);
      }
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
    this.#resolved = null;
  }

  refresh(): void {
    this.#observeHostChain();
    const inherited = this.#resolveInheritedScheme();
    const resolved = resolveDesignSystem(this.#getConfig(), this.#registry, {
      inheritedScheme: inherited.scheme,
      inheritedSource: inherited.source ?? undefined,
      systemScheme: this.#mediaQuery?.matches ? "dark" : "light",
    });
    const signature = JSON.stringify({
      requestedMode: resolved.requestedMode,
      effectiveScheme: resolved.effectiveScheme,
      effectiveModeSource: resolved.effectiveModeSource,
      themeId: resolved.themeId,
      recipeId: resolved.recipeId,
      density: resolved.density,
      motion: resolved.motion,
      tokens: resolved.tokens,
    });

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

    this.#mutationObserver.disconnect();
    this.#observedNodes.clear();

    this.#observeNode(this.#host, false);

    let current: HTMLElement | null = this.#host.parentElement;
    while (current) {
      this.#observeNode(current, true);
      current = current.parentElement;
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
      attributeFilter: [...designSystemObservedAttributeFilter],
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
