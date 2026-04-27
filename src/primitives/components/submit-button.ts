// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import type { FormStatus } from "@/engine";
import { primitiveDefaultLabels, primitiveEventNames, primitiveTagNames } from "../constants";

@customElement(primitiveTagNames.submitButton)
export class PrimitiveSubmitButtonElement extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    button {
      width: 100%;
      min-height: var(--mlf-control-height, 3rem);
      padding: 0.85rem 1.1rem;
      border: none;
      border-radius: var(--mlf-submit-radius, 12px);
      background: var(--mlf-submit-bg, var(--mlf-color-accent, #1e40af));
      color: var(--mlf-submit-color, #ffffff);
      font: inherit;
      font-size: 1rem;
      font-weight: 700;
      cursor: pointer;
      transform: skew(var(--mlf-submit-skew, -12deg));
      transition:
        background-color 0.2s ease-in-out,
        transform 0.2s ease-in-out,
        box-shadow 0.2s ease-in-out,
        opacity 0.2s ease-in-out;
    }

    button:hover:not(:disabled) {
      background: var(--mlf-submit-bg-hover, var(--mlf-color-accent-hover, #1d4ed8));
    }

    button:active:not(:disabled) {
      transform: scale(0.95) skew(var(--mlf-submit-skew, -12deg));
    }

    button:focus-visible {
      outline: none;
      box-shadow: 0 0 0 3px var(--mlf-submit-focus-ring, rgba(29, 78, 216, 0.45));
    }

    button:disabled {
      cursor: progress;
      opacity: 0.78;
    }
  `;

  @property({ type: String }) accessor status: FormStatus = "idle";
  @property({ type: String }) accessor idleLabel = primitiveDefaultLabels.submit;
  @property({ type: String }) accessor validatingLabel = primitiveDefaultLabels.validating;
  @property({ type: String }) accessor submittingLabel = primitiveDefaultLabels.submitting;
  @property({ type: Number }) accessor loaded: number | undefined = undefined;
  @property({ type: Number }) accessor total: number | undefined = undefined;
  @property({ type: String }) accessor progressMessage: string | undefined = undefined;
  @property({ type: Number }) accessor sessionMessageCount: number | undefined = undefined;

  render() {
    const progressLabel =
      this.progressMessage ??
      (typeof this.loaded === "number" && typeof this.total === "number" && this.total > 0
        ? `${Math.round((this.loaded / this.total) * 100)}%`
        : typeof this.sessionMessageCount === "number" && this.sessionMessageCount > 0
          ? `${this.sessionMessageCount} msgs`
          : undefined);
    const label =
      this.status === "validating"
        ? this.validatingLabel
        : this.status === "submitting"
          ? progressLabel
            ? `${this.submittingLabel} ${progressLabel}`
            : this.submittingLabel
          : this.idleLabel;

    return html`
      <button
        type="button"
        ?disabled=${this.status === "validating" || this.status === "submitting"}
        aria-busy=${String(this.status === "validating" || this.status === "submitting")}
        @click=${this.#handleClick}
      >
        ${label}
      </button>
    `;
  }

  #handleClick = (): void => {
    this.dispatchEvent(
      new CustomEvent(primitiveEventNames.submitRequest, {
        bubbles: true,
        composed: true,
      }),
    );
  };
}

declare global {
  interface HTMLElementTagNameMap {
    [primitiveTagNames.submitButton]: PrimitiveSubmitButtonElement;
  }
}
