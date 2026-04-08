// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { css, html, LitElement } from "lit";
import { property } from "lit/decorators.js";
import type { FormStatus } from "@/engine";

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
  @property({ type: String }) accessor idleLabel = "Submit";
  @property({ type: String }) accessor validatingLabel = "Validating...";
  @property({ type: String }) accessor submittingLabel = "Submitting...";

  render() {
    const label =
      this.status === "validating"
        ? this.validatingLabel
        : this.status === "submitting"
          ? this.submittingLabel
          : this.idleLabel;

    return html`
      <button
        type="button"
        ?disabled=${this.status === "validating" || this.status === "submitting"}
        @click=${this.#handleClick}
      >
        ${label}
      </button>
    `;
  }

  #handleClick = (): void => {
    this.dispatchEvent(
      new CustomEvent("mlf-submit-request", {
        bubbles: true,
        composed: true,
      }),
    );
  };
}

customElements.define("mlf-submit-button", PrimitiveSubmitButtonElement);

declare global {
  interface HTMLElementTagNameMap {
    "mlf-submit-button": PrimitiveSubmitButtonElement;
  }
}
