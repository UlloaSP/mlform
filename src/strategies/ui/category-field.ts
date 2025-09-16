import { css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { FieldElement } from "@/extensions/ui";

@customElement("category-field")
export class CategoryField extends FieldElement<string> {
  static styles = [
    FieldElement.baseStyles,
    css`
      select {
        width: 100%;
        padding: 0.75rem 1rem;
        font-size: 1rem;
        border: 1px solid var(--ml-color-border);
        border-radius: var(--radius);
        background: var(--ml-color-surface)
          url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 20 20" fill="%23475569"><path d="M5.516 7.548a.75.75 0 0 1 1.06-.032L10 10.79l3.424-3.274a.75.75 0 0 1 1.029 1.09l-3.955 3.787a.75.75 0 0 1-1.029 0L5.548 8.606a.75.75 0 0 1-.032-1.058z"/></svg>')
          no-repeat right 0.75rem center;
        background-size: 14px 14px;
        appearance: none;
        outline: none;
        transition: border-color 0.2s ease;
      }

      select:focus {
        border-color: var(--ml-color-accent);
      }
    `,
  ];

  @property({
    type: Array,
    converter: {
      fromAttribute(value: string) {
        return value
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      },
    },
  })
  declare optionList: string[];
  @property({ type: String }) declare defaultValue: string;

  firstUpdated() {
    this.value = this.defaultValue;
    if (this.value) {
      this.dispatchState("success", `Category Selected: ${this.value}.`);
    } else {
      this.dispatchState("empty");
    }
  }

  render() {
    return html`
      <select @change=${this.handleChange} .value=${this.value}>
        <option value=${undefined} disabled ?hidden=${!!this.value}>
          — Select —
        </option>
        ${this.optionList.map(
          (opt) => html`
            <option value=${opt} ?selected=${opt === this.value}>${opt}</option>
          `
        )}
      </select>
    `;
  }

  private handleChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.value = this.optionList.find((o) => o === select.value) ?? "";
    this.dispatchState("success", `Category Selected: ${this.value}.`);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "category-field": CategoryField;
  }
}
