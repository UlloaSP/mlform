// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { css, LitElement, type CSSResultGroup } from "lit";
import { property, state } from "lit/decorators.js";
import type { ReportController, ReportDescriptor, ReportStateSnapshot } from "@/engine";
import type { PrimitiveReportRenderContext } from "./types";

export abstract class PrimitiveReportElement extends LitElement {
  static styles: CSSResultGroup = css`
    :host {
      display: block;
    }

    .empty {
      padding: 0.9rem 1rem;
      border-radius: var(--mlf-radius-md, 16px);
      border: var(--mlf-border-width, 1px) dashed var(--mlf-report-border, var(--mlf-color-border));
      color: var(--mlf-report-empty-color, var(--mlf-color-text-muted));
      background: var(
        --mlf-report-empty-bg,
        color-mix(in srgb, var(--mlf-color-accent) 6%, transparent)
      );
    }
  `;

  @property({ attribute: false }) accessor controller: ReportController | undefined;
  @property({ attribute: false }) accessor descriptor: ReportDescriptor | null = null;
  @property({ attribute: false }) accessor context: PrimitiveReportRenderContext | undefined;

  @state() protected accessor reportState: ReportStateSnapshot | null = null;

  #unsubscribe: (() => void) | null = null;
  #connectedController: ReportController | undefined;

  protected willUpdate(changedProperties: Map<string, unknown>): void {
    if (changedProperties.has("controller")) {
      this.#attachController();
    }
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.#attachController();
  }

  disconnectedCallback(): void {
    this.#unsubscribe?.();
    this.#unsubscribe = null;
    this.#connectedController = undefined;
    super.disconnectedCallback();
  }

  protected get props(): Record<string, unknown> {
    return this.descriptor?.props ?? {};
  }

  protected get reportContext(): PrimitiveReportRenderContext | undefined {
    return this.context;
  }

  #attachController(): void {
    if (!this.isConnected) {
      return;
    }

    if (this.#connectedController === this.controller) {
      this.#syncFromController();
      return;
    }

    this.#unsubscribe?.();
    this.#unsubscribe = null;
    this.#connectedController = this.controller;
    this.#syncFromController();

    if (!this.controller) {
      return;
    }

    this.#unsubscribe = this.controller.subscribe(() => {
      this.#syncFromController();
    });
  }

  #syncFromController(): void {
    this.descriptor = this.controller?.descriptor ?? this.descriptor ?? null;
    this.reportState = this.controller?.state ?? null;
  }
}
