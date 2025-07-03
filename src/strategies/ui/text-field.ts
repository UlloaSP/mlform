import { html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import { FieldElement } from "@/extensions";

@customElement("text-field")
export class TextField extends FieldElement<string> {
  static styles = [
    FieldElement.baseStyles,
    css`
      input[type="text"] {
        width: 100%;
        padding: 0.75rem 1rem;
        font-size: 1rem;
        border: 1px solid var(--color-border);
        border-radius: var(--radius);
        outline: none;
        transition: border-color 0.2s ease;
      }
      input[type="text"]:focus {
        border-color: var(--color-accent);
      }
    `,
  ];

  @property({ type: String }) placeholder: string = "Enter text...";
  @property({ type: String }) pattern: string = "";
  @property({ type: String }) declare defaultValue: string;
  @property({ type: String }) declare minlength: string;
  @property({ type: String }) declare maxlength: string;

  firstUpdated() {
    if (this.defaultValue) {
      this.value = this.defaultValue;
      console.log(this.value);
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
      this.value = "";
    }
  }

  render() {
    return html`
      <div class="input-wrapper">
        <input
          type="text"
          autocomplete="off"
          @input=${this.onInput}
          .value=${this.value}
          .placeholder=${this.placeholder}
          .minlength=${this.minlength}
          .maxlength=${this.maxlength}
        />
      </div>
    `;
  }

  private onInput(e: InputEvent) {
    this.value = (e.target as HTMLInputElement).value;
    if (this.value === "") {
      this.dispatchState("empty");
      return;
    }

    if (
      this.minlength &&
      this.maxlength &&
      this.value.length < Number(this.minlength) &&
      this.value.length > Number(this.maxlength)
    ) {
      this.dispatchState(
        "error",
        `Length must be between ${this.minlength} and ${this.maxlength} characters.`
      );
      return;
    }

    if (this.minlength && this.value.length < Number(this.minlength)) {
      this.dispatchState(
        "error",
        `Minimum length is ${this.minlength} characters.`
      );
      return;
    }
    if (this.maxlength && this.value.length > Number(this.maxlength)) {
      this.dispatchState(
        "error",
        `Maximum length of ${this.maxlength} characters exceeded.`
      );
      return;
    }

    if (this.pattern !== "") {
      const regex = new RegExp(this.pattern);
      if (!regex.test(this.value)) {
        this.dispatchState("error", "Invalid characters detected.");
        return;
      }
    }

    this.dispatchState(
      "success",
      this.maxlength
        ? `Note recorded (${this.value.length}/${this.maxlength}).`
        : `Note recorded (Length: ${this.value.length}).`
    );
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "text-field": TextField;
  }
}
