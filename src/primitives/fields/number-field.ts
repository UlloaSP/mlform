// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { css, html } from "lit";
import { customElement, state } from "lit/decorators.js";
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

      .range-wrapper {
        display: grid;
        gap: 0.75rem;
      }

      .range-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
        min-width: 0;
      }

      .range-value {
        color: var(--mlf-number-unit-color, var(--mlf-color-text-muted, #475569));
        font-size: 0.9rem;
        font-weight: 700;
        line-height: 1.2;
        text-align: right;
      }

      input[type="range"].control {
        min-height: auto;
        padding: 0;
        border: none;
        border-radius: 999px;
        background: transparent;
        box-shadow: none;
        appearance: none;
        cursor: pointer;
      }

      input[type="range"].control:focus-visible {
        outline: none;
        box-shadow: none;
      }

      input[type="range"].control:disabled {
        background: transparent;
      }

      input[type="range"].control::-webkit-slider-runnable-track {
        height: 0.4rem;
        border-radius: 999px;
        background: var(--mlf-range-track, var(--mlf-color-border, #d1d5db));
      }

      input[type="range"].control::-moz-range-track {
        height: 0.4rem;
        border-radius: 999px;
        background: var(--mlf-range-track, var(--mlf-color-border, #d1d5db));
      }

      input[type="range"].control::-webkit-slider-thumb {
        width: 1.1rem;
        height: 1.1rem;
        margin-top: -0.35rem;
        border: 2px solid var(--mlf-range-thumb-border, #ffffff);
        border-radius: 50%;
        background: var(--mlf-range-thumb, var(--mlf-color-accent, #1e40af));
        box-shadow: 0 1px 3px rgba(15, 23, 42, 0.2);
        appearance: none;
      }

      input[type="range"].control::-moz-range-thumb {
        width: 1.1rem;
        height: 1.1rem;
        border: 2px solid var(--mlf-range-thumb-border, #ffffff);
        border-radius: 50%;
        background: var(--mlf-range-thumb, var(--mlf-color-accent, #1e40af));
        box-shadow: 0 1px 3px rgba(15, 23, 42, 0.2);
      }

      input[type="range"].control:focus-visible::-webkit-slider-thumb {
        box-shadow: 0 0 0 4px var(--mlf-input-shadow-focus, rgba(29, 78, 216, 0.18));
      }

      input[type="range"].control:focus-visible::-moz-range-thumb {
        box-shadow: 0 0 0 4px var(--mlf-input-shadow-focus, rgba(29, 78, 216, 0.18));
      }
    `,
  ];

  @state() private accessor draftValue: string | null = null;
  @state() private accessor focused = false;

  render() {
    const props = this.props;
    const context = this.fieldContext;
    const inputMode = props.input === "range" ? "range" : "text";
    const committedValue =
      typeof props.value === "number"
        ? String(props.value)
        : props.value === null || props.value === undefined
          ? ""
          : toText(props.value);
    const value = this.focused && this.draftValue !== null ? this.draftValue : committedValue;
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
    const rangeValue = value.length > 0 ? value : committedValue;

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
            .value=${rangeValue}
            min=${ifDefined(minValue)}
            max=${ifDefined(maxValue)}
            step=${ifDefined(typeof props.step === "number" ? String(props.step) : undefined)}
            aria-label=${context?.label ?? toText(props.label)}
            aria-describedby=${ifDefined(context?.describedBy)}
            aria-invalid=${String(context?.invalid ?? false)}
            aria-valuenow=${ifDefined(numericValue)}
            aria-valuemin=${ifDefined(minValue)}
            aria-valuemax=${ifDefined(maxValue)}
            ?required=${Boolean(props.required)}
            ?disabled=${Boolean(this.fieldContext?.disabled)}
            ?readonly=${Boolean(this.fieldContext?.readOnly)}
            @input=${this.#handleRangeInput}
            @blur=${this.#handleBlur}
          />
        </div>
        ${this.renderAssistiveText()}
      `;
    }

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
          placeholder=${toText(props.placeholder)}
          aria-label=${context?.label ?? toText(props.label)}
          aria-describedby=${ifDefined(context?.describedBy)}
          aria-invalid=${String(context?.invalid ?? false)}
          aria-valuenow=${ifDefined(numericValue)}
          aria-valuemin=${ifDefined(minValue)}
          aria-valuemax=${ifDefined(maxValue)}
          ?required=${Boolean(props.required)}
          ?disabled=${Boolean(this.fieldContext?.disabled)}
          ?readonly=${Boolean(this.fieldContext?.readOnly)}
          @focus=${this.#handleFocus}
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
    this.draftValue = value;
    this.commitValue(this.#getCommittedValue(value));
  };

  #handleBlur = (): void => {
    this.focused = false;
    this.commitValue(this.draftValue === null || this.draftValue === "" ? null : this.draftValue);
    this.draftValue = null;
    this.commitBlur();
  };

  #handleFocus = (): void => {
    this.focused = true;
    this.draftValue =
      typeof this.props.value === "number"
        ? String(this.props.value)
        : this.props.value === null || this.props.value === undefined
          ? ""
          : toText(this.props.value);
  };

  #handleRangeInput = (event: Event): void => {
    const value = (event.target as HTMLInputElement).value;
    const parsed = Number(value);
    this.draftValue = value;
    this.commitValue(Number.isNaN(parsed) ? null : parsed);
  };

  #getCommittedValue(value: string): string | number | null {
    const trimmed = value.trim();

    if (trimmed.length === 0) {
      return null;
    }

    if (/^[+-]?$/.test(trimmed) || /^[+-]?\.$/.test(trimmed)) {
      return null;
    }

    if (/^[+-]?(?:\d+|\d+\.|\d*\.\d+)$/.test(trimmed)) {
      const parsed = Number(trimmed);
      return Number.isNaN(parsed) ? value : parsed;
    }

    return value;
  }
}
