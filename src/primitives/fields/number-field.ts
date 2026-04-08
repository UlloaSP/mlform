// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { css, html } from "lit";
import { customElement } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { PrimitiveFieldElement } from "../base-field-element";
import { toText } from "../utils";

@customElement("mlf-number-field")
export class PrimitiveNumberFieldElement extends PrimitiveFieldElement {
  static styles = [
    PrimitiveFieldElement.styles,
    css`
      .input-wrapper {
        position: relative;
      }

      input {
        min-height: var(--mlf-control-height, 3rem);
        padding-right: calc(var(--mlf-number-unit-width, 0px) + 2rem);
        appearance: textfield;
      }

      input::-webkit-outer-spin-button,
      input::-webkit-inner-spin-button {
        margin: 0;
        -webkit-appearance: none;
      }

      .unit {
        position: absolute;
        top: 50%;
        right: 1rem;
        transform: translateY(-50%);
        min-width: var(--mlf-number-unit-width, 1rem);
        color: var(--mlf-number-unit-color, var(--mlf-color-secondary, #475569));
        font-size: 0.9rem;
        pointer-events: none;
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

    return html`
      <div
        class="input-wrapper"
        style=${`--mlf-number-unit-width: ${unit ? Math.max(unit.length * 0.5, 1) : 0}rem;`}
      >
        <input
          class="control"
          type="number"
          id=${context?.controlId ?? ""}
          .value=${value}
          aria-label=${context?.label ?? toText(props.label)}
          aria-describedby=${ifDefined(context?.describedBy)}
          aria-invalid=${String(context?.invalid ?? false)}
          ?required=${Boolean(props.required)}
          ?disabled=${Boolean(this.fieldState?.disabled)}
          ?readonly=${Boolean(this.fieldState?.readOnly)}
          min=${ifDefined(
            typeof props.min === "number" || typeof props.min === "string"
              ? String(props.min)
              : undefined,
          )}
          max=${ifDefined(
            typeof props.max === "number" || typeof props.max === "string"
              ? String(props.max)
              : undefined,
          )}
          step=${ifDefined(
            typeof props.step === "number" || typeof props.step === "string"
              ? String(props.step)
              : undefined,
          )}
          @input=${this.#handleInput}
          @blur=${this.#handleBlur}
        />
        <span class="unit">${unit}</span>
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
