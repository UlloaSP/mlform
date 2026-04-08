// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { css, html } from "lit";
import { customElement } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { PrimitiveFieldElement } from "../base-field-element";
import { toText } from "../utils";

type Option = string | { label: string; value: string };

@customElement("mlf-category-field")
export class PrimitiveCategoryFieldElement extends PrimitiveFieldElement {
  static styles = [
    PrimitiveFieldElement.styles,
    css`
      select {
        min-height: var(--mlf-control-height, 3rem);
        padding-right: 2.8rem;
        background: var(--mlf-input-bg, var(--mlf-color-surface, #ffffff))
          url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 20 20' fill='%23475569'><path d='M5.516 7.548a.75.75 0 0 1 1.06-.032L10 10.79l3.424-3.274a.75.75 0 0 1 1.029 1.09l-3.955 3.787a.75.75 0 0 1-1.029 0L5.548 8.606a.75.75 0 0 1-.032-1.058z'/></svg>")
          no-repeat right 0.9rem center;
        background-size: 14px 14px;
        appearance: none;
      }
    `,
  ];

  render() {
    const props = this.props;
    const context = this.fieldContext;
    const value = typeof props.value === "string" ? props.value : "";
    const options = Array.isArray(props.options) ? (props.options as Option[]) : [];

    return html`
      <select
        class="control"
        id=${context?.controlId ?? ""}
        .value=${value}
        aria-label=${context?.label ?? toText(props.label)}
        aria-describedby=${ifDefined(context?.describedBy)}
        aria-invalid=${String(context?.invalid ?? false)}
        aria-readonly=${String(Boolean(this.fieldState?.readOnly))}
        ?required=${Boolean(props.required)}
        ?disabled=${Boolean(this.fieldState?.disabled || this.fieldState?.readOnly)}
        @change=${this.#handleChange}
        @blur=${this.#handleBlur}
      >
        <option value="">&#8212; Select &#8212;</option>
        ${options.map((option) => {
          const normalized = typeof option === "string" ? { label: option, value: option } : option;
          return html`<option value=${normalized.value}>${normalized.label}</option>`;
        })}
      </select>
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
