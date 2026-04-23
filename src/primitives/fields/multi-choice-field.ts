// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { css, html } from "lit";
import { customElement } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { PrimitiveFieldElement } from "../base-field-element";
import { primitiveTagNames } from "../constants";
import { toText } from "../utils";

type Option = string | { label: string; value: string };

const normalizeOption = (option: Option): { label: string; value: string } =>
  typeof option === "string" ? { label: option, value: option } : option;

@customElement(primitiveTagNames.multiChoiceField)
export class PrimitiveMultiChoiceFieldElement extends PrimitiveFieldElement {
  static styles = [
    PrimitiveFieldElement.styles,
    css`
      fieldset {
        border: none;
        padding: 0;
        margin: 0;
        min-width: 0;
      }

      legend {
        display: none;
      }

      .options {
        display: flex;
        gap: 0.5rem 1.25rem;
      }

      .options.vertical {
        flex-direction: column;
      }

      .options.horizontal {
        flex-direction: row;
        flex-wrap: wrap;
      }

      label {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        cursor: pointer;
        color: var(--mlf-toggle-label-color, var(--mlf-color-text, #0f172a));
        font-size: 0.95rem;
        line-height: 1.4;
        user-select: none;
      }

      label.disabled {
        cursor: not-allowed;
        opacity: 0.72;
      }

      input[type="checkbox"] {
        width: 1.1rem;
        height: 1.1rem;
        margin: 0;
        flex-shrink: 0;
        accent-color: var(--mlf-toggle-accent, var(--mlf-color-accent, #1e40af));
        cursor: pointer;
        border-radius: 3px;
      }

      input[type="checkbox"]:disabled {
        cursor: not-allowed;
      }

      input[type="checkbox"]:focus-visible {
        outline: 2px solid var(--mlf-input-border-focus, var(--mlf-color-accent, #1e40af));
        outline-offset: 2px;
      }
    `,
  ];

  render() {
    const props = this.props;
    const context = this.fieldContext;
    const selected = Array.isArray(props.value) ? (props.value as string[]) : [];
    const options = Array.isArray(props.options) ? (props.options as Option[]) : [];
    const layout = props.layout === "horizontal" ? "horizontal" : "vertical";
    const groupLabel = context?.label ?? toText(props.label);
    const disabled = Boolean(context?.disabled || context?.readOnly);

    return html`
      <fieldset>
        <legend>${groupLabel}</legend>
        <div
          class="options ${layout}"
          role="group"
          aria-label=${groupLabel}
          aria-describedby=${ifDefined(context?.describedBy)}
          aria-invalid=${String(context?.invalid ?? false)}
          aria-required=${String(Boolean(props.required))}
        >
          ${options.map((opt) => {
            const { label, value } = normalizeOption(opt);
            const inputId = `${context?.controlId ?? "mc"}-${value}`;
            return html`
              <label class=${disabled ? "disabled" : ""} for=${inputId}>
                <input
                  type="checkbox"
                  id=${inputId}
                  .value=${value}
                  .checked=${selected.includes(value)}
                  ?disabled=${disabled}
                  @change=${(e: Event) => this.#handleChange(e, value)}
                  @blur=${this.#handleBlur}
                />
                ${label}
              </label>
            `;
          })}
        </div>
      </fieldset>
      ${this.renderAssistiveText()}
    `;
  }

  #handleChange = (event: Event, value: string): void => {
    const checked = (event.target as HTMLInputElement).checked;
    const current = Array.isArray(this.props.value) ? (this.props.value as string[]) : [];
    const next = checked ? [...current, value] : current.filter((v) => v !== value);
    this.commitValue(next);
  };

  #handleBlur = (): void => {
    this.commitBlur();
  };
}
