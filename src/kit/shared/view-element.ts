// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { LitElement } from "lit";
import { property, state } from "lit/decorators.js";
import type { FormViewController, FormViewSnapshot } from "@/view";
import type { MountFormOptions } from "../mount-types";

export abstract class KitViewElement extends LitElement {
  @property({ attribute: false }) accessor view: FormViewController | undefined;
  @property({ attribute: false }) accessor reportPane: NonNullable<MountFormOptions["reportPane"]> =
    "auto";
  @state() protected accessor snapshot: FormViewSnapshot | null = null;

  #boundView: FormViewController | undefined;
  #unsubscribe: (() => void) | undefined;

  connectedCallback(): void {
    super.connectedCallback();
    this.#bindView();
  }

  protected willUpdate(changed: Map<string, unknown>): void {
    super.willUpdate(changed);
    if (changed.has("view")) this.#bindView();
  }

  disconnectedCallback(): void {
    this.#unsubscribe?.();
    this.#unsubscribe = undefined;
    this.#boundView = undefined;
    super.disconnectedCallback();
  }

  #bindView(): void {
    if (!this.isConnected || (this.#boundView === this.view && this.#unsubscribe)) return;
    this.#unsubscribe?.();
    this.#boundView = this.view;
    this.snapshot = this.view?.getSnapshot() ?? null;
    this.#unsubscribe = this.view?.subscribe((snapshot) => {
      this.snapshot = snapshot;
    });
  }
}
