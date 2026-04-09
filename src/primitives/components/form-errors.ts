// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { css, html, LitElement } from "lit";
import { property, state } from "lit/decorators.js";
import type { FormController, FormState } from "@/engine";
import { primitiveStaticText, primitiveTagNames } from "../constants";

export class PrimitiveFormErrorsElement extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    .card {
      padding: 1rem 1.25rem;
      border-radius: 12px;
      border: var(--mlf-border-width, 1px) solid
        var(--mlf-error-border, var(--mlf-color-danger, #dc2626));
      background: var(
        --mlf-error-bg,
        color-mix(in srgb, var(--mlf-color-danger, #dc2626) 8%, transparent)
      );
      color: var(--mlf-error-color, var(--mlf-color-danger, #dc2626));
    }

    .eyebrow {
      margin: 0 0 0.45rem;
      font-family: var(--mlf-font-family-ui);
      font-size: var(--mlf-font-size-xs, 0.72rem);
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }

    ul {
      margin: 0;
      padding-left: 1.1rem;
      font-family: var(--mlf-font-family-ui);
      font-size: var(--mlf-font-size-sm, 0.84rem);
    }
  `;

  @property({ attribute: false }) accessor form: FormController | undefined;

  @state() private accessor formState: FormState | null = null;

  #unsubscribe: (() => void) | null = null;
  #connectedForm: FormController | undefined;

  protected willUpdate(changedProperties: Map<string, unknown>): void {
    if (changedProperties.has("form")) {
      this.#attachForm();
    }
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.#attachForm();
  }

  disconnectedCallback(): void {
    this.#unsubscribe?.();
    this.#unsubscribe = null;
    this.#connectedForm = undefined;
    super.disconnectedCallback();
  }

  render() {
    const errors = this.formState?.errors.form ?? [];

    if (errors.length === 0) {
      return html``;
    }

    return html`
      <div class="card" part="form-errors">
        <p class="eyebrow">${primitiveStaticText.formErrorsTitle}</p>
        <ul>
          ${errors.map((error) => html`<li>${error}</li>`)}
        </ul>
      </div>
    `;
  }

  #attachForm(): void {
    if (!this.isConnected) {
      return;
    }

    if (this.#connectedForm === this.form) {
      this.formState = this.form?.state ?? null;
      return;
    }

    this.#unsubscribe?.();
    this.#unsubscribe = null;
    this.#connectedForm = this.form;
    this.formState = this.form?.state ?? null;

    if (!this.form) {
      return;
    }

    this.#unsubscribe = this.form.subscribe((state) => {
      this.formState = state;
    });
  }
}

customElements.define(primitiveTagNames.formErrors, PrimitiveFormErrorsElement);

declare global {
  interface HTMLElementTagNameMap {
    [primitiveTagNames.formErrors]: PrimitiveFormErrorsElement;
  }
}
