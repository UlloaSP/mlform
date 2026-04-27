// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { ReactiveController, ReactiveControllerHost } from "lit";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Subscribable = { subscribe(listener: (...args: any[]) => void): () => void };

/**
 * Lit ReactiveController that manages subscribe/unsubscribe lifecycle for any
 * controller that exposes a `subscribe(listener) => unsubscribe` method.
 * Eliminates the repeated attach/detach boilerplate across primitive elements.
 *
 * Usage:
 *   readonly #binding = new ControllerBinding(this, (ctrl) => {
 *     this.myState = ctrl?.state ?? null;
 *   });
 *
 *   protected willUpdate(changed) {
 *     if (changed.has("controller")) this.#binding.bind(this.controller);
 *   }
 */
export class ControllerBinding<T extends Subscribable> implements ReactiveController {
  readonly #host: ReactiveControllerHost & { readonly isConnected: boolean };
  readonly #onSync: (controller: T | undefined) => void;

  #current: T | undefined;
  #unsubscribe: (() => void) | null = null;

  constructor(
    host: ReactiveControllerHost & { readonly isConnected: boolean },
    onSync: (controller: T | undefined) => void,
  ) {
    this.#host = host;
    this.#onSync = onSync;
    host.addController(this);
  }

  /**
   * Bind to a new controller instance. Safe to call before the host connects —
   * the actual subscription is deferred until `hostConnected`.
   */
  bind(controller: T | undefined): void {
    if (!this.#host.isConnected) {
      // Store for when hostConnected fires.
      this.#current = controller;
      return;
    }

    if (this.#current === controller) {
      // Same instance — re-sync state and re-subscribe if reconnect cleared the listener.
      this.#onSync(controller);
      if (!controller || this.#unsubscribe) {
        return;
      }

      this.#unsubscribe = controller.subscribe(() => this.#onSync(this.#current));
      return;
    }

    this.#unsubscribe?.();
    this.#unsubscribe = null;
    this.#current = controller;
    this.#onSync(controller);

    if (!controller) return;

    this.#unsubscribe = controller.subscribe(() => this.#onSync(this.#current));
  }

  hostConnected(): void {
    this.bind(this.#current);
  }

  hostDisconnected(): void {
    this.#unsubscribe?.();
    this.#unsubscribe = null;
  }
}
