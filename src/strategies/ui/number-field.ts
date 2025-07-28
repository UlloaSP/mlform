import { css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { FieldElement } from "@/extensions/ui";

@customElement("number-field")
export class NumberField extends FieldElement<number> {
  static styles = [
    FieldElement.baseStyles,
    css`
      .input-wrapper {
        position: relative;
      }
      input[type="text"] {
        width: 100%;
        padding: 0.75rem calc(var(--unit-w) + 2rem) 0.75rem 1rem;
        font-size: 1rem;
        border: 1px solid var(--color-border);
        border-radius: var(--radius);
        outline: none;
        transition: border-color 0.2s ease;
        white-space: nowrap;
        overflow-x: auto;
        overflow-y: hidden;
        -webkit-overflow-scrolling: touch;
      }
      input[type="text"]:focus {
        border-color: var(--color-accent);
      }
      .unit {
        position: absolute;
        right: 1rem;
        top: 50%;
        min-width: var(--unit-w);
        transform: translateY(-50%);
        font-size: 0.9rem;
        color: var(--color-secondary);
        pointer-events: none;
      }
    `,
  ];

  @property({ type: String }) unit: string = "";
  @property({ type: String }) step: string = "1";
  @property({ type: String }) declare min: string;
  @property({ type: String }) declare max: string;
  @property({ type: String }) declare defaultValue: string;
  @property({ type: String }) declare placeholder: string;

  firstUpdated() {
    if (!this.placeholder) {
      this.placeholder = this.step;
    }
    if (this.defaultValue) {
      this.value = Number(this.defaultValue);
      const mockEvent = new InputEvent("input", {
        bubbles: true,
        composed: true,
      });
      Object.defineProperty(mockEvent, "target", {
        value: { value: this.defaultValue },
        writable: false,
      });
      this.onInput(mockEvent);
    } else {
      this.value = NaN;
    }
  }

  render() {
    return html`
      <div class="input-wrapper">
        <input
          type="text"
          inputmode="decimal"
          autocomplete="off"
          @input=${this.onInput}
          .step=${Number(this.step)}
          .min=${Number(this.min)}
          .max=${Number(this.max)}
          .placeholder=${this.placeholder}
          .value=${!Number.isNaN(this.value) ? this.value : ""}
        />
        <span class="unit">${this.unit}</span>
      </div>
    `;
  }

  private onInput(e: InputEvent) {
    this.value = Number((e.target as HTMLInputElement).value.trim());
    if (!this.value) {
      this.dispatchState("empty");
      return;
    }

    const ALLOWED = /^[0-9.,\s-]+$/;
    if (!ALLOWED.test(this.value.toString())) {
      this.dispatchState(
        "error",
        "Only digits, comma, dot, space, and a leading minus are allowed."
      );
      return;
    }

    const minusCount = (this.value.toString().match(/-/g) || []).length;
    if (
      minusCount > 1 ||
      (minusCount === 1 && !this.value.toString().startsWith("-"))
    ) {
      this.dispatchState(
        "error",
        "Minus sign must appear once and only at the beginning."
      );
      return;
    }

    const numberPattern =
      /^-?(?:\d{1,3}(?:([,\s])\d{3}(?:\1\d{3})*)|\d+)(?:[.]\d+)?$/;
    if (!numberPattern.test(this.value.toString())) {
      this.dispatchState(
        "error",
        "Invalid number format (check grouping or decimal separator)."
      );
      return;
    }

    const num = this.parseLocaleNumber(this.value.toString());

    if (
      this.min &&
      this.max &&
      (num < parseFloat(this.min) || num > parseFloat(this.max))
    ) {
      this.dispatchState(
        "error",
        `Number must be between 
        ${this.min} ${this.unit} and 
        ${this.max ?? ""} ${this.unit}`
      );
      return;
    }

    if (this.min && num < parseFloat(this.min)) {
      this.dispatchState(
        "error",
        `Number must be greater than or equal to ${this.min} ${this.unit}`
      );
      return;
    }

    if (this.max && num > parseFloat(this.max)) {
      this.dispatchState(
        "error",
        `Number must be less than or equal to ${this.max} ${this.unit}`
      );
      return;
    }

    this.dispatchState(
      "success",
      `Valid Number: ${num.toLocaleString("en-US", {})} ${this.unit}`
    );
  }

  private parseLocaleNumber(str: string): number {
    let s = str.replace(/\s+/g, "");
    let sign = "";
    if (s.startsWith("-")) {
      sign = "-";
      s = s.slice(1);
    }
    const lastDot = s.lastIndexOf(".");
    const idx = Math.max(lastDot);
    let intPart: string;
    let decPart = "";
    if (idx !== -1) {
      intPart = s.slice(0, idx);
      decPart = s.slice(idx + 1);
    } else {
      intPart = s;
    }
    intPart = intPart.replace(/[.,]/g, "");
    return parseFloat(sign + (decPart ? `${intPart}.${decPart}` : intPart));
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "number-field": NumberField;
  }
}
