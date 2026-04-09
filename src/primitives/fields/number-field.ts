// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { css, html } from "lit";
import { customElement } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { PrimitiveFieldElement } from "../base-field-element";
import { primitiveTagNames } from "../constants";
import { toText } from "../utils";

@customElement(primitiveTagNames.numberField)
export class PrimitiveNumberFieldElement extends PrimitiveFieldElement {
  static styles = [
    PrimitiveFieldElement.styles,
    css`
      .input-wrapper {
        position: relative;
        min-width: 0;
      }

      input {
        min-height: var(--mlf-control-height, 3rem);
        padding-right: calc(var(--mlf-number-unit-width, 2rem) + 2rem);
        white-space: nowrap;
        overflow-x: auto;
        overflow-y: hidden;
        text-overflow: clip;
        -webkit-overflow-scrolling: touch;
        appearance: textfield;
      }

      .unit {
        position: absolute;
        top: 50%;
        right: 0.85rem;
        transform: translateY(-50%);
        display: inline-flex;
        align-items: center;
        justify-content: flex-end;
        max-width: 40%;
        min-width: var(--mlf-number-unit-width, 2rem);
        padding-left: 0.65rem;
        background: linear-gradient(
          90deg,
          color-mix(
              in srgb,
              var(--mlf-number-overlay-bg, var(--mlf-input-bg, var(--mlf-color-surface, #ffffff)))
                0%,
              transparent
            )
            0%,
          var(--mlf-number-overlay-bg, var(--mlf-input-bg, var(--mlf-color-surface, #ffffff))) 45%
        );
        color: var(--mlf-number-unit-color, var(--mlf-color-text-muted, #475569));
        font-size: 0.9rem;
        font-weight: 700;
        line-height: 1;
        white-space: nowrap;
        pointer-events: none;
      }

      .input-wrapper.is-disabled .unit {
        opacity: 0.72;
        --mlf-number-overlay-bg: var(--mlf-input-bg-disabled, var(--mlf-color-bg-light, #f5f7fa));
      }

      .input-wrapper.is-readonly .unit {
        --mlf-number-overlay-bg: var(--mlf-input-bg-readonly, var(--mlf-color-bg-light, #f5f7fa));
      }

      .unit:empty {
        display: none;
      }
    `,
  ];

  render() {
    const props = this.props;
    const context = this.fieldContext;
    const value =
      typeof props.value === "number"
        ? String(props.value)
        : props.value === null || props.value === undefined
          ? ""
          : toText(props.value);
    const unit = typeof props.unit === "string" ? props.unit : "";
    const unitWidth = `${Math.max(unit.length * 0.56 + 0.8, 2.2)}rem`;
    const wrapperClass = this.fieldState?.disabled
      ? "input-wrapper is-disabled"
      : this.fieldState?.readOnly
        ? "input-wrapper is-readonly"
        : "input-wrapper";

    return html`
      <div class=${wrapperClass} style=${`--mlf-number-unit-width: ${unitWidth};`}>
        <input
          class="control"
          type="text"
          inputmode="decimal"
          spellcheck="false"
          autocomplete="off"
          id=${context?.controlId ?? ""}
          .value=${value}
          aria-label=${context?.label ?? toText(props.label)}
          aria-describedby=${ifDefined(context?.describedBy)}
          aria-invalid=${String(context?.invalid ?? false)}
          ?required=${Boolean(props.required)}
          ?disabled=${Boolean(this.fieldState?.disabled)}
          ?readonly=${Boolean(this.fieldState?.readOnly)}
          @input=${this.#handleInput}
          @blur=${this.#handleBlur}
        />
        <span class="unit" aria-hidden="true">${unit}</span>
      </div>
      ${this.renderAssistiveText()}
    `;
  }

  #handleInput = (event: Event): void => {
    const value = (event.target as HTMLInputElement).value;
    this.commitValue(value === "" ? null : value);
  };

  #handleBlur = (): void => {
    this.commitBlur();
  };
}
