// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { css, html } from "lit";
import { customElement } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { PrimitiveFieldElement } from "../base-field-element";
import { primitiveStaticText, primitiveTagNames } from "../constants";
import { toText } from "../utils";

type Option = string | { label: string; value: string };

const normalizeOption = (option: Option): { label: string; value: string } => {
  return typeof option === "string" ? { label: option, value: option } : option;
};

const resolveSelectedValue = (value: unknown, options: Option[]): string => {
  if (typeof value !== "string" || value.length === 0) {
    return "";
  }

  return options.some((option) => normalizeOption(option).value === value) ? value : "";
};

@customElement(primitiveTagNames.categoryField)
export class PrimitiveCategoryFieldElement extends PrimitiveFieldElement {
  static styles = [
    PrimitiveFieldElement.styles,
    css`
      .select-wrap {
        position: relative;
        min-width: 0;
      }

      select {
        min-height: var(--mlf-control-height, 3rem);
        padding-right: 2.8rem;
        appearance: none;
      }

      .chevron {
        position: absolute;
        top: 50%;
        right: 0.9rem;
        width: 14px;
        height: 14px;
        transform: translateY(-50%);
        color: var(--mlf-category-chevron-color, var(--mlf-color-text-muted, #475569));
        pointer-events: none;
      }

      .chevron svg {
        display: block;
        width: 100%;
        height: 100%;
      }
    `,
  ];

  render() {
    const props = this.props;
    const context = this.fieldContext;
    const rawValue = typeof props.value === "string" ? props.value : "";
    const options = Array.isArray(props.options) ? (props.options as Option[]) : [];
    const value = resolveSelectedValue(rawValue, options);

    return html`
      <div class="select-wrap">
        <select
          class="control"
          id=${context?.controlId ?? ""}
          aria-label=${context?.label ?? toText(props.label)}
          aria-describedby=${ifDefined(context?.describedBy)}
          aria-invalid=${String(context?.invalid ?? false)}
          aria-readonly=${String(Boolean(this.fieldState?.readOnly))}
          ?required=${Boolean(props.required)}
          ?disabled=${Boolean(this.fieldState?.disabled || this.fieldState?.readOnly)}
          @change=${this.#handleChange}
          @blur=${this.#handleBlur}
        >
          <option value="" ?selected=${value === ""}>
            &#8212; ${primitiveStaticText.categoryPlaceholder} &#8212;
          </option>
          ${options.map((option) => {
            const normalized = normalizeOption(option);
            return html`
              <option value=${normalized.value} ?selected=${normalized.value === value}>
                ${normalized.label}
              </option>
            `;
          })}
        </select>
        <span class="chevron" aria-hidden="true">
          <svg viewBox="0 0 20 20" fill="currentColor">
            <path
              d="M5.516 7.548a.75.75 0 0 1 1.06-.032L10 10.79l3.424-3.274a.75.75 0 0 1 1.029 1.09l-3.955 3.787a.75.75 0 0 1-1.029 0L5.548 8.606a.75.75 0 0 1-.032-1.058z"
            ></path>
          </svg>
        </span>
      </div>
      ${this.renderAssistiveText()}
    `;
  }

  #handleChange = (event: Event): void => {
    const value = (event.target as HTMLSelectElement).value;
    this.commitValue(value === "" ? null : value);
  };

  #handleBlur = (): void => {
    this.commitBlur();
  };
}
