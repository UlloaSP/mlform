import { css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { FieldElement } from "@/extensions/ui";

@customElement("date-field")
export class DateField extends FieldElement<Date> {
  static styles = [
    FieldElement.baseStyles,
    css`
      input[type="date"] {
        display: inline-block;
        width: 100%;
        padding: 0.75rem 0.75rem;
        font-size: 1rem;
        border: 1px solid var(--color-border);
        border-radius: var(--radius);
        outline: none;
        transition: border-color 0.2s ease;
      }
      input[type="date"]:focus {
        border-color: var(--color-accent);
      }
    `,
  ];

  @property({ type: String }) step: string = "1";
  @property({
    type: Date,
    converter: {
      fromAttribute(value: string): Date {
        return new Date(value);
      },
      toAttribute(date: Date): string {
        return date.toISOString().split("T")[0];
      },
    },
  })
  declare min: Date;
  @property({
    type: Date,
    converter: {
      fromAttribute(value: string): Date {
        return new Date(value);
      },
      toAttribute(date: Date): string {
        return date.toISOString().split("T")[0];
      },
    },
  })
  declare max: Date;
  @property({
    type: Date,
    converter: {
      fromAttribute(value: string): Date {
        return new Date(value);
      },
      toAttribute(date: Date): string {
        return date.toISOString().split("T")[0];
      },
    },
  })
  declare defaultValue: Date;

  protected firstUpdated(): void {
    if (this.defaultValue) {
      this.value = this.defaultValue;
      const mockEvent = new InputEvent("input", {
        bubbles: true,
        composed: true,
      });
      Object.defineProperty(mockEvent, "target", {
        value: { value: this.formatDateUTC(this.defaultValue) },
        writable: false,
      });
      this.onInput(mockEvent);
    }
  }

  render() {
    return html`
      <div class="input-wrapper">
        <input
          type="date"
          @input=${this.onInput}
          .step=${this.step}
          .value=${this.value ? this.formatDateUTC(this.value) : undefined}
          .min=${this.min ? this.formatDateUTC(this.min) : undefined}
          .max=${this.max ? this.formatDateUTC(this.max) : undefined}
        />
      </div>
    `;
  }

  private onInput(e: InputEvent) {
    this.value = new Date((e.target as HTMLInputElement).value);
    if (!this.value) {
      this.dispatchState("empty");
      return;
    }

    if (
      this.max &&
      this.min &&
      (this.value < this.min || this.value > this.max)
    ) {
      this.dispatchState(
        "error",
        `Date must be between ${this.formatDateUTC(
          this.min
        )} and ${this.formatDateUTC(this.max)}.`
      );
      return;
    }

    if (this.max && this.value > this.max) {
      this.dispatchState(
        "error",
        `Date must not be after ${this.formatDateUTC(this.max)}.`
      );
      return;
    }

    if (this.min && this.value < this.min) {
      this.dispatchState(
        "error",
        `Date must not be before ${this.formatDateUTC(this.min)}.`
      );
      return;
    }

    const stepDays = Math.max(1, Number(this.step) || 1);
    const base = this.min
      ? this.startOfDayUTC(this.min)
      : new Date(Date.UTC(1970, 0, 1));
    const diffDays = Math.round(
      (this.value.getTime() - base.getTime()) / 86_400_000
    );
    const aligned = diffDays % stepDays === 0;

    if (!aligned) {
      const lastIdx = Math.floor(diffDays / stepDays);
      const lastDate = new Date(
        base.getTime() + lastIdx * stepDays * 86_400_000
      );
      const nextDate = new Date(lastDate.getTime() + stepDays * 86_400_000);

      const partes: string[] = [];
      if (!this.min || lastDate >= this.startOfDayUTC(this.min)) {
        partes.push(`Last valid date: ${this.formatDateUTC(lastDate)}`);
      }
      if (!this.max || nextDate <= this.startOfDayUTC(this.max)) {
        partes.push(`Next valid date: ${this.formatDateUTC(nextDate)}`);
      }

      this.dispatchState(
        "error",
        `The Date must advance or retrocede in steps of ${stepDays} day(s) starting from ${this.formatDateUTC(
          base
        )}\n ${partes[0]}. \n ${partes[1]}.`
      );
      return;
    }

    this.dispatchState(
      "success",
      `Selected Date: ${this.formatDateUTC(this.value)}`
    );
  }

  private startOfDayUTC(d: Date): Date {
    return new Date(
      Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
    );
  }

  private formatDateUTC(d: Date): string {
    return d.toISOString().split("T")[0];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "date-field": DateField;
  }
}
