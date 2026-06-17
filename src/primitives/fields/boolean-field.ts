// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { css, html } from "lit";
import { customElement } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { PrimitiveFieldElement } from "../base-field-element";
import { primitiveIdPrefixes, primitiveTagNames } from "../constants";
import { toText } from "../utils";

@customElement(primitiveTagNames.booleanField)
export class PrimitiveBooleanFieldElement extends PrimitiveFieldElement {
  static styles = [
    PrimitiveFieldElement.styles,
    css`
      fieldset {
        display: flex;
        width: 100%;
        margin: 0;
        padding: 0;
        border: none;
      }

      input[type="radio"] {
        position: absolute;
        opacity: 0;
        pointer-events: none;
      }

      .opt {
        flex: 1 1 50%;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 0.65rem 0.25rem;
        font-size: 0.9rem;
        font-weight: 500;
        color: var(--mlf-toggle-text, var(--mlf-color-text, #0f172a));
        background: var(
          --mlf-toggle-bg,
          color-mix(in srgb, var(--mlf-color-accent, #1e40af) 10%, transparent)
        );
        border: var(--mlf-border-width, 1px) solid
          var(--mlf-toggle-border, var(--mlf-color-border, #e2e8f0));
        cursor: pointer;
        user-select: none;
        transition:
          background 0.2s ease,
          color 0.2s ease,
          border-color 0.2s ease;
        transform: skewX(var(--mlf-toggle-skew, -12deg));
        margin-right: -1px;
      }

      .opt:last-of-type {
        margin-right: 0;
      }

      .opt span {
        transform: skewX(calc(-1 * var(--mlf-toggle-skew, -12deg)));
      }

      .opt:hover {
        background: var(
          --mlf-toggle-bg-hover,
          color-mix(in srgb, var(--mlf-color-accent, #1e40af) 18%, transparent)
        );
      }

      input[type="radio"]:checked + label.opt {
        background: var(--mlf-toggle-bg-active, var(--mlf-color-success, #059669));
        border-color: var(--mlf-toggle-border-active, var(--mlf-color-success, #059669));
        color: var(--mlf-toggle-text-active, #ffffff);
      }

      input[type="radio"]:disabled + label.opt {
        cursor: not-allowed;
        opacity: 0.68;
      }
    `,
  ];

  render() {
    const props = this.props;
    const context = this.fieldContext;
    const selected = props.checked === true ? true : props.checked === false ? false : null;
    const text = this.text;
    const fallbackControlId = primitiveIdPrefixes.booleanGroup;
    const trueId = `${context?.controlId ?? fallbackControlId}-true`;
    const falseId = `${context?.controlId ?? fallbackControlId}-false`;
    const trueLabel = toText(props.trueLabel, text.booleanTrue);
    const falseLabel = toText(props.falseLabel, text.booleanFalse);
    const disabled = Boolean(this.fieldContext?.disabled || this.fieldContext?.readOnly);

    return html`
      <fieldset
        role="radiogroup"
        aria-label=${context?.label ?? toText(props.label)}
        aria-describedby=${ifDefined(context?.describedBy)}
        aria-invalid=${String(context?.invalid ?? false)}
        aria-readonly=${String(Boolean(this.fieldContext?.readOnly))}
      >
        <input
          type="radio"
          id=${trueId}
          name=${context?.controlId ?? fallbackControlId}
          value="true"
          .checked=${selected === true}
          ?disabled=${disabled}
          @change=${this.#handleChange}
          @blur=${this.#handleBlur}
        />
        <label class="opt" for=${trueId}><span>${trueLabel}</span></label>

        <input
          type="radio"
          id=${falseId}
          name=${context?.controlId ?? fallbackControlId}
          value="false"
          .checked=${selected === false}
          ?disabled=${disabled}
          @change=${this.#handleChange}
          @blur=${this.#handleBlur}
        />
        <label class="opt" for=${falseId}><span>${falseLabel}</span></label>
      </fieldset>
      ${this.renderAssistiveText()}
    `;
  }

  #handleChange = (event: Event): void => {
    this.commitValue((event.target as HTMLInputElement).value === "true");
  };

  #handleBlur = (): void => {
    this.commitBlur();
  };
}
