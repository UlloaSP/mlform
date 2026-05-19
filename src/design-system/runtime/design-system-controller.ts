// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin
import { builtinDesignSystemRegistry } from "../registry";
import type {
  DesignSystemConfig,
  DesignSystemControllerOptions,
  DesignSystemRegistry,
  DesignSystemTransitionContext,
  DesignSystemTransition,
  ResolvedDesignSystem,
} from "../types";
import {
  addControllerMediaListeners,
  dispatchDesignSystemChange,
  getControllerMediaSnapshot,
  removeControllerMediaListeners,
  resolveControllerDesignSystem,
} from "./controller-helpers";
import { createResolvedDesignSystemSignature } from "./host-state";
import {
  applyResolvedDesignSystem,
  managedDesignSystemAttributes,
  restoreManagedDesignSystem,
} from "./apply-tokens";
import { fingerprintEnvironment, type DesignSystemMediaSnapshot } from "./fingerprint";
import {
  captureOriginalTokenValues,
  restoreRemovedTokenValues,
  seedHydratedResolvedState,
} from "./hydration-state";
import { createMediaQueries, type MediaQueryListWithLegacy } from "./media";
import { observeHostChain } from "./host-observer";

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

    const mediaQueries = createMediaQueries();
    this.#schemeMediaQuery = mediaQueries.scheme;
    this.#motionMediaQuery = mediaQueries.motion;
    this.#contrastMediaQuery = mediaQueries.contrast;
    this.#forcedColorsMediaQuery = mediaQueries.forcedColors;

    this.#schemeMediaListener = () => this.refresh();
    this.#motionMediaListener = () => this.refresh();
    this.#contrastMediaListener = () => this.refresh();
    this.#forcedColorsMediaListener = () => this.refresh();

    this.#mutationObserver =
      typeof MutationObserver !== "undefined" ? new MutationObserver(() => this.refresh()) : null;

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
  get #mediaListeners() {
    return [
      { query: this.#schemeMediaQuery, listener: this.#schemeMediaListener },
      { query: this.#motionMediaQuery, listener: this.#motionMediaListener },
      { query: this.#contrastMediaQuery, listener: this.#contrastMediaListener },
      { query: this.#forcedColorsMediaQuery, listener: this.#forcedColorsMediaListener },
    ];
  }

  connect(): void {
    if (this.#connected) {
      return;
    }

    this.#connected = true;

    addControllerMediaListeners(this.#mediaListeners);

    observeHostChain(this.#host, this.#mutationObserver, this.#observedNodes);
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

    removeControllerMediaListeners(this.#mediaListeners);

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

    observeHostChain(this.#host, this.#mutationObserver, this.#observedNodes);

    const config = this.#getConfig();
    const media = this.#getMediaSnapshot();

    const envSnapshot = fingerprintEnvironment(config, media);
    if (envSnapshot === this.#envSnapshot && (config.mode ?? "auto") !== "inherit") {
      return;
    }

    const resolved = resolveControllerDesignSystem(this.#host, config, this.#registry, media);

    const signature = createResolvedDesignSystemSignature(resolved);

    this.#envSnapshot = envSnapshot;

    if (signature === this.#signature) {
      return;
    }

    const previousResolved = this.#resolved;
    this.#signature = signature;
    this.#resolved = resolved;

    const applyDomUpdate = (): void => {
      captureOriginalTokenValues(this.#host, this.#originalTokenValues, resolved.tokens);
      restoreRemovedTokenValues(
        this.#host,
        this.#appliedTokens,
        this.#originalTokenValues,
        resolved.tokens,
      );
      this.#appliedTokens = applyResolvedDesignSystem(this.#host, resolved, this.#transition);
      this.#onChange?.(resolved);
      dispatchDesignSystemChange(this.#host, resolved);
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

  #seedHydratedState(): boolean {
    const config = this.#getConfig();
    const media = this.#getMediaSnapshot();
    const resolved = resolveControllerDesignSystem(this.#host, config, this.#registry, media);

    const seeded = seedHydratedResolvedState(this.#host, this.#originalTokenValues, {
      resolved,
      envSnapshot: fingerprintEnvironment(config, media),
    });
    if (!seeded) {
      return false;
    }

    this.#appliedTokens = seeded.appliedTokens;
    this.#resolved = seeded.resolved;
    this.#signature = seeded.signature;
    this.#envSnapshot = seeded.envSnapshot;
    return true;
  }

  #cancelPendingTransition(): void {
    this.#transitionAbortController?.abort();
    this.#transitionAbortController = null;
    this.#transitionCleanup?.();
    this.#transitionCleanup = null;
  }

  #getMediaSnapshot(): DesignSystemMediaSnapshot {
    return getControllerMediaSnapshot(
      this.#schemeMediaQuery,
      this.#motionMediaQuery,
      this.#contrastMediaQuery,
      this.#forcedColorsMediaQuery,
    );
  }
}
