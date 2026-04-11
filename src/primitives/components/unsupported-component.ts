// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import { primitiveStaticText, primitiveTagNames, type PrimitiveText } from "../constants";

@customElement(primitiveTagNames.unsupportedComponent)
export class UnsupportedComponent extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    .card {
      padding: 0.85rem 1rem;
      border-radius: var(--mlf-radius-md, 16px);
      border: var(--mlf-border-width, 1px) dashed var(--mlf-error-border, var(--mlf-color-danger));
      background: var(--mlf-error-bg);
      color: var(--mlf-error-color, var(--mlf-color-danger));
      font-family: var(--mlf-font-family-ui);
      font-size: 0.95rem;
    }

    strong {
      display: block;
      margin-bottom: 0.25rem;
      font-size: var(--mlf-font-size-xs, 0.72rem);
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
  `;

  @property({ type: String }) accessor component = "";
  @property({ type: String }) accessor role = "renderer";
  @property({ attribute: false }) accessor text: PrimitiveText = primitiveStaticText;

  render() {
    return html`
      <div class="card" part="unsupported-card">
        <strong>${this.role}</strong>
        ${this.text.unsupportedMapping(this.role, this.component)}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [primitiveTagNames.unsupportedComponent]: UnsupportedComponent;
  }
}
