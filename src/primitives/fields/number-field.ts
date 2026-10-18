// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { html } from "lit";
import { customElement } from "lit/decorators.js";
import { live } from "lit/directives/live.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { PrimitiveFieldElement } from "../base-field-element";
import { primitiveTagNames } from "../constants";
import { toText } from "../utils";
import { numberFieldStyles } from "./number-field-styles";
import { NumericDraft, stepNumericDraft } from "./numeric-draft";

@customElement(primitiveTagNames.numberField)
export class PrimitiveNumberFieldElement extends PrimitiveFieldElement {
  static styles = [PrimitiveFieldElement.styles, numberFieldStyles];

  readonly #draft = new NumericDraft();

  render() {
    const props = this.props;
    const context = this.fieldContext;
    const inputMode = props.input === "range" ? "range" : "text";
    const value = this.#draft.display(props.value);
    const unit = typeof props.unit === "string" ? props.unit : "";
    const unitWidth = `${Math.max(unit.length * 0.56 + 0.8, 2.2)}rem`;
    const wrapperClass = this.fieldContext?.disabled
      ? "input-wrapper is-disabled"
      : this.fieldContext?.readOnly
        ? "input-wrapper is-readonly"
        : "input-wrapper";
    const numericValue = typeof props.value === "number" ? props.value : undefined;
    const minValue = typeof props.min === "number" ? props.min : undefined;
    const maxValue = typeof props.max === "number" ? props.max : undefined;
    const rangeValue = value;

    if (inputMode === "range") {
      return html`
        <div class="range-wrapper">
          <div class="range-header">
            <span class="range-value">${rangeValue}${unit ? ` ${unit}` : ""}</span>
          </div>
          <input
            class="control"
            type="range"
            id=${context?.controlId ?? ""}
            min=${ifDefined(minValue)}
            max=${ifDefined(maxValue)}
            step=${ifDefined(typeof props.step === "number" ? String(props.step) : undefined)}
            .value=${live(rangeValue)}
            aria-label=${context?.label ?? toText(props.label)}
            aria-describedby=${ifDefined(context?.describedBy)}
            aria-invalid=${String(context?.invalid ?? false)}
            aria-valuenow=${ifDefined(numericValue)}
            aria-valuetext=${ifDefined(unit && numericValue !== undefined ? `${numericValue} ${unit}` : undefined)}
            aria-valuemin=${ifDefined(minValue)}
            aria-valuemax=${ifDefined(maxValue)}
            ?required=${Boolean(props.required)}
            ?disabled=${Boolean(context?.disabled || context?.readOnly)}
            aria-readonly=${String(Boolean(context?.readOnly))}
            @input=${this.#handleRangeInput}
            @blur=${this.#handleBlur}
          />
        </div>
        ${this.renderAssistiveText()}
      `;
    }

    return html`
      <div
        class=${wrapperClass}
        style=${`--mlf-number-unit-width: ${unitWidth};`}
        title=${ifDefined(unit || undefined)}
      >
        <input
          class="control"
          type="text"
          role="spinbutton"
          inputmode="decimal"
          spellcheck="false"
          autocomplete="off"
          id=${context?.controlId ?? ""}
          .value=${value}
          placeholder=${toText(props.placeholder)}
          aria-label=${context?.label ?? toText(props.label)}
          aria-describedby=${ifDefined(context?.describedBy)}
          aria-invalid=${String(context?.invalid ?? false)}
          aria-valuenow=${ifDefined(numericValue)}
          aria-valuetext=${ifDefined(unit && numericValue !== undefined ? `${numericValue} ${unit}` : undefined)}
          aria-valuemin=${ifDefined(minValue)}
          aria-valuemax=${ifDefined(maxValue)}
          min=${ifDefined(minValue)}
          max=${ifDefined(maxValue)}
          step=${ifDefined(typeof props.step === "number" ? props.step : undefined)}
          ?required=${Boolean(props.required)}
          ?disabled=${Boolean(this.fieldContext?.disabled)}
          ?readonly=${Boolean(this.fieldContext?.readOnly)}
          @input=${this.#handleInput}
          @keydown=${(event: KeyboardEvent) => stepNumericDraft(event, numericValue)}
          @blur=${this.#handleBlur}
        />
        <span class="unit" aria-hidden="true">${unit}</span>
      </div>
      ${this.renderAssistiveText()}
    `;
  }

  #handleInput = (event: Event): void => {
    const value = (event.target as HTMLInputElement).value;
    this.commitValue(value);
    this.#draft.record(value, this.controller ? this.controller.state.value : this.props.value);
    this.requestUpdate();
  };

  #handleBlur = (): void => {
    this.commitBlur();
  };

  #handleRangeInput = (event: Event): void => {
    this.commitValue(Number((event.target as HTMLInputElement).value));
  };
}
