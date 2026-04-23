// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { css, html } from "lit";
import { customElement } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { PrimitiveFieldElement } from "../base-field-element";
import { primitiveTagNames } from "../constants";
import { toText } from "../utils";

@customElement(primitiveTagNames.longTextField)
export class PrimitiveLongTextFieldElement extends PrimitiveFieldElement {
  static styles = [
    PrimitiveFieldElement.styles,
    css`
      textarea.control {
        resize: vertical;
        min-height: 6rem;
        line-height: 1.5;
      }
    `,
  ];

  render() {
    const props = this.props;
    const context = this.fieldContext;
    const value = typeof props.value === "string" ? props.value : "";
    const rows = typeof props.rows === "number" && props.rows > 0 ? props.rows : 4;

    return html`
      <textarea
        class="control"
        id=${context?.controlId ?? ""}
        .value=${value}
        placeholder=${toText(props.placeholder)}
        rows=${rows}
        aria-label=${context?.label ?? toText(props.label)}
        aria-describedby=${ifDefined(context?.describedBy)}
        aria-invalid=${String(context?.invalid ?? false)}
        ?required=${Boolean(props.required)}
        ?disabled=${Boolean(context?.disabled)}
        ?readonly=${Boolean(context?.readOnly)}
        @input=${this.#handleInput}
        @blur=${this.#handleBlur}
      ></textarea>
      ${this.renderAssistiveText()}
    `;
  }

  #handleInput = (event: Event): void => {
    this.commitValue((event.target as HTMLTextAreaElement).value);
  };

  #handleBlur = (): void => {
    this.commitBlur();
  };
}
