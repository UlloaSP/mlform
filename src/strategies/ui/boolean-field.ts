// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { FieldElement } from "@/extensions/ui";

@customElement("boolean-field")
export class BooleanField extends FieldElement<boolean> {
  static styles = [
    FieldElement.baseStyles,
    css`
      fieldset {
        display: flex;
        width: 100%;
        margin: 0;
        padding: 0;
        border: none;
      }

      input[type="radio"] {
        display: none;
      }

      .opt {
        flex: 1 1 50%;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 0.65rem 0.25rem;
        font-size: 0.9rem;
        font-weight: 500;
        color: var(--ml-color-primary);
        background: var(--ml-color-accent-bg);
        border: 1px solid var(--ml-color-border);
        cursor: pointer;
        user-select: none;
        transition:
          background 0.2s ease,
          color 0.2s ease,
          border-color 0.2s;
        transform: skewX(var(--skew));
        margin-right: -1px;
      }
      .opt:last-of-type {
        margin-right: 0;
      }
      .opt span {
        transform: skewX(calc(-1 * var(--skew)));
      }

      .opt:hover {
        background: var(--ml-color-hv-light);
      }

      input[type="radio"]:checked + label.opt {
        background: var(--ml-color-success);
        border-color: var(--ml-color-success);
        color: var(--ml-color-surface);
      }
    `,
  ];

  @property({ type: String }) declare defaultValue: string;

  firstUpdated() {
    if (this.defaultValue) {
      this.value = this.defaultValue === "true";
      this.dispatchState("success", `Status set to: ${this.value}.`);
    }
  }

  private onChange(e: Event) {
    const target = e.target as HTMLInputElement;
    this.value = target.value === "true";
    if (!target.checked) return;
    this.dispatchState("success", `Status set to: ${this.value}.`);
  }

  render() {
    return html`
      <fieldset role="radiogroup">
        <input
          type="radio"
          id="opt_yes"
          name="bool"
          @change=${this.onChange}
          .value=${true}
          .checked=${this.value === true}
        />
        <label class="opt" for="opt_yes"><span>True</span></label>

        <input
          type="radio"
          id="opt_no"
          name="bool"
          @change=${this.onChange}
          .value=${false}
          .checked=${this.value === false}
        />
        <label class="opt" for="opt_no"><span>False</span></label>
      </fieldset>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "boolean-field": BooleanField;
  }
}
