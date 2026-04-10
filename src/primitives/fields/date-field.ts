// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { css, html } from "lit";
import { customElement } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { PrimitiveFieldElement } from "../base-field-element";
import { primitiveTagNames } from "../constants";
import { toText } from "../utils";

@customElement(primitiveTagNames.dateField)
export class PrimitiveDateFieldElement extends PrimitiveFieldElement {
  static styles = [
    PrimitiveFieldElement.styles,
    css`
      input {
        min-height: var(--mlf-control-height, 3rem);
      }

      input::-webkit-calendar-picker-indicator {
        cursor: pointer;
      }
    `,
  ];

  render() {
    const props = this.props;
    const context = this.fieldContext;
    const value = typeof props.value === "string" ? props.value : "";

    return html`
      <input
        class="control"
        type="date"
        id=${context?.controlId ?? ""}
        .value=${value}
        aria-label=${context?.label ?? toText(props.label)}
        aria-describedby=${ifDefined(context?.describedBy)}
        aria-invalid=${String(context?.invalid ?? false)}
        ?required=${Boolean(props.required)}
        ?disabled=${Boolean(this.fieldState?.disabled)}
        ?readonly=${Boolean(this.fieldState?.readOnly)}
        min=${ifDefined(typeof props.min === "string" ? props.min : undefined)}
        max=${ifDefined(typeof props.max === "string" ? props.max : undefined)}
        step=${ifDefined(typeof props.step === "number" ? String(props.step) : undefined)}
        @input=${this.#handleInput}
        @blur=${this.#handleBlur}
      />
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
