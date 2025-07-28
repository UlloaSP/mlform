import { css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { FieldElement } from "@/extensions/ui";

@customElement("range-field")
export class RangeField extends FieldElement<number> {
  static styles = [
    FieldElement.baseStyles,
    css`
      input[type="range"] {
        width: 99%;
        -webkit-appearance: none;
        appearance: none;
        height: 6px;
        border-radius: 3px;
        background: var(--range-track, #d1d5db);
        outline: none;
      }
      input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: var(--range-thumb, var(--color-accent, #1e40af));
        cursor: pointer;
        border: 2px solid #fff;
        box-shadow: 0 0 2px rgba(0, 0, 0, 0.2);
        transition: background 0.2s ease;
      }
      input[type="range"]::-moz-range-thumb {
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: var(--range-thumb, var(--color-accent, #1e40af));
        cursor: pointer;
        border: 2px solid #fff;
      }
    `,
  ];

  @property({ type: String }) unit: string = "";
  @property({ type: String }) step: string = "1";
  @property({ type: String }) declare min: string;
  @property({ type: String }) declare max: string;
  @property({ type: String }) declare defaultValue: string;

  protected firstUpdated(): void {
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
  }

  render() {
    return html`
      <div class="input-wrapper">
        <input
          type="range"
          @input=${this.onInput}
          .min=${this.min}
          .max=${this.max}
          .step=${this.step}
          .value=${this.value}
        />
      </div>
    `;
  }

  private onInput(e: InputEvent) {
    this.value = Number((e.target as HTMLInputElement).value);
    this.dispatchState(
      "success",
      `Selected Value: ${this.value.toLocaleString("en-US")} ${this.unit}`
    );
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "range-field": RangeField;
  }
}
