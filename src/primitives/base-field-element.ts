// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { css, html, LitElement, nothing, type CSSResultGroup, type TemplateResult } from "lit";
import { property } from "lit/decorators.js";
import type { FieldDescriptor } from "@/presentation";
import type { FieldController } from "@/runtime";
import { primitiveStaticText, type PrimitiveText } from "./constants";
import type { PrimitiveFieldRenderContext } from "./types";

// field-frame.ts owns the subscription to FieldController and passes
// descriptor + context as properties to this element.  No second subscription
// is needed here — that would cause a redundant render on every state change.
export abstract class PrimitiveFieldElement extends LitElement {
  static styles: CSSResultGroup = css`
    :host {
      display: block;
      min-width: 0;
      box-sizing: border-box;
    }

    *,
    *::before,
    *::after {
      box-sizing: border-box;
    }

    .control {
      display: block;
      width: 100%;
      max-width: 100%;
      box-sizing: border-box;
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
  @property({ attribute: false }) accessor text: PrimitiveText = primitiveStaticText;

  protected commitValue(value: unknown): void {
    if (this.context?.disabled || this.context?.readOnly) {
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
      ${context.errorId
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
}
