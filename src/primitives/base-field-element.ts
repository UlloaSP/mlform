// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { css, html, LitElement, nothing, type CSSResultGroup, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import type { FieldController, FieldDescriptor, FieldStateSnapshot } from "@/engine";
import type { PrimitiveFieldRenderContext } from "./types";

export abstract class PrimitiveFieldElement extends LitElement {
  static styles: CSSResultGroup = css`
    :host {
      display: block;
    }

    .control {
      width: 100%;
      min-height: var(--mlf-control-height, 3rem);
      padding: 0.75rem 1rem;
      border: var(--mlf-border-width, 1px) solid
        var(--mlf-input-border, var(--mlf-color-border, #e2e8f0));
      border-radius: var(--mlf-input-radius, 12px);
      background: var(--mlf-input-bg, var(--mlf-color-surface, #ffffff));
      color: var(--mlf-input-text, var(--mlf-color-text, #0f172a));
      font: inherit;
      line-height: 1.4;
      transition:
        border-color 0.2s ease,
        box-shadow 0.2s ease,
        background-color 0.2s ease;
    }

    .control:focus-visible {
      outline: none;
      border-color: var(--mlf-input-border-focus, var(--mlf-color-accent, #1e40af));
      box-shadow: 0 0 0 3px var(--mlf-input-shadow-focus, rgba(29, 78, 216, 0.18));
    }

    .control:disabled {
      cursor: not-allowed;
      opacity: 0.72;
      background: var(--mlf-input-bg-disabled, var(--mlf-color-bg-light, #f5f7fa));
    }

    .control[readonly] {
      background: var(--mlf-input-bg-readonly, var(--mlf-color-bg-light, #f5f7fa));
    }

    .control::placeholder {
      color: var(--mlf-input-placeholder, var(--mlf-color-text-muted, #475569));
    }

    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }
  `;

  @property({ attribute: false }) accessor controller: FieldController | undefined;
  @property({ attribute: false }) accessor descriptor: FieldDescriptor | null = null;
  @property({ attribute: false }) accessor context: PrimitiveFieldRenderContext | undefined;

  @state() protected accessor fieldState: FieldStateSnapshot | null = null;

  #unsubscribe: (() => void) | null = null;
  #connectedController: FieldController | undefined;

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

  protected commitValue(value: unknown): void {
    if (this.fieldState?.disabled || this.fieldState?.readOnly) {
      return;
    }

    this.controller?.setValue(value);
  }

  protected commitBlur(): void {
    this.controller?.blur();
    void this.controller?.validate();
  }

  protected get props(): Record<string, unknown> {
    return this.descriptor?.props ?? {};
  }

  protected get fieldContext(): PrimitiveFieldRenderContext | undefined {
    return this.context;
  }

  protected renderAssistiveText(): TemplateResult | typeof nothing {
    const context = this.fieldContext;

    if (!context) {
      return nothing;
    }

    return html`
      ${context.description && context.descriptionId
        ? html`<span id=${context.descriptionId} class="sr-only">${context.description}</span>`
        : nothing}
      ${context.errors.length > 0 && context.errorId
        ? html`
            <span id=${context.errorId} class="sr-only" aria-live="polite">
              ${context.errors.join(" ")}
            </span>
          `
        : nothing}
    `;
  }

  protected getControlAttributes(): {
    controlId?: string;
    describedBy?: string;
    invalid: boolean;
  } {
    const context = this.fieldContext;

    return {
      controlId: context?.controlId,
      describedBy: context?.describedBy,
      invalid: context?.invalid ?? false,
    };
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
    this.fieldState = this.controller?.state ?? null;
  }
}
