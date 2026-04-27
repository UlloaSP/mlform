// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { css, html } from "lit";
import { customElement } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { PrimitiveFieldElement } from "../base-field-element";
import { primitiveTagNames } from "../constants";
import { toText } from "../utils";

@customElement(primitiveTagNames.ratingField)
export class PrimitiveRatingFieldElement extends PrimitiveFieldElement {
  static styles = [
    PrimitiveFieldElement.styles,
    css`
      .rating-container {
        display: inline-flex;
        gap: 0.25rem;
        align-items: center;
        flex-wrap: wrap;
      }

      .rating-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 2.5rem;
        min-height: 2.5rem;
        padding: 0.25rem 0.5rem;
        border: var(--mlf-border-width, 1px) solid
          var(--mlf-input-border, var(--mlf-color-border, #e2e8f0));
        border-radius: var(--mlf-input-radius, 12px);
        background: var(--mlf-input-bg, var(--mlf-color-surface, #ffffff));
        color: var(--mlf-input-text, var(--mlf-color-text, #0f172a));
        font: inherit;
        font-size: 0.9rem;
        font-weight: 500;
        cursor: pointer;
        transition:
          border-color 0.15s ease,
          background-color 0.15s ease,
          color 0.15s ease;
      }

      .rating-btn:hover:not(:disabled) {
        border-color: var(--mlf-input-border-focus, var(--mlf-color-accent, #1e40af));
        background: color-mix(in srgb, var(--mlf-color-accent, #1e40af) 8%, transparent);
      }

      .rating-btn.selected {
        border-color: var(--mlf-color-accent, #1e40af);
        background: var(--mlf-color-accent, #1e40af);
        color: #ffffff;
      }

      .rating-btn:disabled {
        cursor: not-allowed;
        opacity: 0.72;
      }

      .rating-btn:focus-visible {
        outline: none;
        border-color: var(--mlf-input-border-focus, var(--mlf-color-accent, #1e40af));
        box-shadow: 0 0 0 3px var(--mlf-input-shadow-focus, rgba(29, 78, 216, 0.18));
      }
    `,
  ];

  render() {
    const props = this.props;
    const context = this.fieldContext;
    const selectedValue = typeof props.value === "number" ? props.value : null;
    const min = typeof props.min === "number" ? props.min : 1;
    const max = typeof props.max === "number" ? props.max : 5;
    const step = typeof props.step === "number" && props.step > 0 ? props.step : 1;
    const disabled = Boolean(context?.disabled || context?.readOnly);
    const groupLabel = context?.label ?? toText(props.label);

    const points: number[] = [];
    for (let v = min; v <= max; v += step) {
      points.push(v);
    }

    return html`
      <div
        role="slider"
        aria-label=${groupLabel}
        aria-valuenow=${ifDefined(selectedValue !== null ? selectedValue : undefined)}
        aria-valuemin=${min}
        aria-valuemax=${max}
        aria-invalid=${String(context?.invalid ?? false)}
        aria-required=${String(Boolean(props.required))}
        aria-describedby=${ifDefined(context?.describedBy)}
        aria-disabled=${String(disabled)}
        tabindex="-1"
      >
        <div class="rating-container">
          ${points.map(
            (point) => html`
              <button
                type="button"
                class="rating-btn ${selectedValue === point ? "selected" : ""}"
                aria-label=${`${point}`}
                aria-pressed=${String(selectedValue === point)}
                ?disabled=${disabled}
                @click=${() => this.#handleClick(point)}
                @blur=${this.#handleBlur}
                @keydown=${(e: KeyboardEvent) => this.#handleKeydown(e, point, min, max, step)}
              >
                ${point}
              </button>
            `,
          )}
        </div>
      </div>
      ${this.renderAssistiveText()}
    `;
  }

  #handleClick = (point: number): void => {
    const current = typeof this.props.value === "number" ? this.props.value : null;
    // Toggle off if clicking the same value
    this.commitValue(current === point ? null : point);
  };

  #handleBlur = (): void => {
    this.commitBlur();
  };

  #handleKeydown = (
    event: KeyboardEvent,
    point: number,
    min: number,
    max: number,
    step: number,
  ): void => {
    if (event.key === "ArrowRight" || event.key === "ArrowUp") {
      event.preventDefault();
      const next = point + step;
      if (next <= max) this.commitValue(next);
    } else if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
      event.preventDefault();
      const prev = point - step;
      if (prev >= min) this.commitValue(prev);
    }
  };
}
