// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { css, html } from "lit";
import { customElement } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { PrimitiveFieldElement } from "../base-field-element";
import { primitiveTagNames } from "../constants";
import { toText } from "../utils";

@customElement(primitiveTagNames.textField)
export class PrimitiveTextFieldElement extends PrimitiveFieldElement {
  static styles = [
    PrimitiveFieldElement.styles,
    css`
      input {
        min-height: var(--mlf-control-height, 3rem);
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
        type="text"
        id=${context?.controlId ?? ""}
        .value=${value}
        aria-label=${context?.label ?? toText(props.label)}
        aria-describedby=${ifDefined(context?.describedBy)}
        aria-invalid=${String(context?.invalid ?? false)}
        placeholder=${toText(props.placeholder)}
        ?required=${Boolean(props.required)}
        ?disabled=${Boolean(this.fieldContext?.disabled)}
        ?readonly=${Boolean(this.fieldContext?.readOnly)}
        minlength=${ifDefined(
          typeof props.minLength === "number" ? String(props.minLength) : undefined,
        )}
        maxlength=${ifDefined(
          typeof props.maxLength === "number" ? String(props.maxLength) : undefined,
        )}
        pattern=${ifDefined(typeof props.pattern === "string" ? props.pattern : undefined)}
        @input=${this.#handleInput}
        @blur=${this.#handleBlur}
      />
      ${this.renderAssistiveText()}
    `;
  }

  #handleInput = (event: Event): void => {
    this.commitValue((event.target as HTMLInputElement).value);
  };

  #handleBlur = (): void => {
    this.commitBlur();
  };
}
