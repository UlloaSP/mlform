// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { css, html } from "lit";
import { customElement, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { PrimitiveFieldElement } from "../base-field-element";
import { primitiveTagNames } from "../constants";
import { toText } from "../utils";

type DraftRow = {
  key: string;
  timestamp: string;
  value: string;
};

type SerializedPoint = {
  timestamp?: unknown;
  value?: unknown;
};

let rowSequence = 0;

const pad = (value: number): string => String(value).padStart(2, "0");

const toDateInputValue = (value: Date): string => {
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
};

const toDateTimeInputValue = (value: Date): string => {
  return `${toDateInputValue(value)}T${pad(value.getHours())}:${pad(value.getMinutes())}`;
};

const normalizeTimestampValue = (value: unknown, granularity: "date" | "datetime"): string => {
  if (typeof value !== "string" || value.length === 0) {
    return "";
  }

  if (granularity === "date") {
    return value.slice(0, 10);
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value.slice(0, 16);
  }

  return toDateTimeInputValue(parsed);
};

const createRowKey = (): string => `ts-row-${++rowSequence}`;

const createDefaultTimestamp = (
  rows: DraftRow[],
  granularity: "date" | "datetime",
  direction: "asc" | "desc" | false,
): string => {
  const previous = rows.at(-1)?.timestamp;
  const seed =
    typeof previous === "string" && previous.length > 0 ? new Date(previous) : new Date();
  const next = Number.isNaN(seed.getTime()) ? new Date() : seed;

  if (rows.length > 0) {
    if (granularity === "datetime") {
      next.setHours(next.getHours() + (direction === "desc" ? -1 : 1));
    } else {
      next.setDate(next.getDate() + (direction === "desc" ? -1 : 1));
    }
  }

  return granularity === "datetime" ? toDateTimeInputValue(next) : toDateInputValue(next);
};

const normalizeRows = (value: unknown, granularity: "date" | "datetime"): DraftRow[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((point) => {
    const row = point as SerializedPoint;
    return {
      key: createRowKey(),
      timestamp: normalizeTimestampValue(row.timestamp, granularity),
      value:
        typeof row.value === "number"
          ? String(row.value)
          : typeof row.value === "string"
            ? row.value
            : "",
    } satisfies DraftRow;
  });
};

@customElement(primitiveTagNames.timeSeriesField)
export class PrimitiveTimeSeriesFieldElement extends PrimitiveFieldElement {
  static styles = [
    PrimitiveFieldElement.styles,
    css`
      .series {
        display: grid;
        gap: 0.9rem;
      }

      .toolbar {
        display: flex;
        justify-content: flex-end;
      }

      .add-btn,
      .remove-btn {
        border: var(--mlf-border-width, 1px) solid
          var(--mlf-time-series-action-border, var(--mlf-color-border, #cbd5e1));
        background: var(
          --mlf-time-series-action-bg,
          color-mix(in srgb, var(--mlf-color-accent, #1e40af) 9%, #ffffff)
        );
        color: var(--mlf-time-series-action-text, var(--mlf-color-text, #0f172a));
        font: inherit;
        line-height: 1;
        cursor: pointer;
        transition:
          background 0.2s ease,
          border-color 0.2s ease,
          transform 0.2s ease;
      }

      .add-btn {
        padding: 0.7rem 1rem;
        border-radius: 999px;
        font-size: 0.85rem;
        font-weight: 700;
        letter-spacing: 0.01em;
      }

      .remove-btn {
        width: 2.25rem;
        height: 2.25rem;
        border-radius: 0.8rem;
        font-size: 1.15rem;
      }

      .add-btn:hover:not(:disabled),
      .remove-btn:hover:not(:disabled) {
        background: var(
          --mlf-time-series-action-bg-hover,
          color-mix(in srgb, var(--mlf-color-accent, #1e40af) 16%, #ffffff)
        );
        border-color: var(--mlf-time-series-action-border-hover, var(--mlf-color-accent, #1e40af));
        transform: translateY(-1px);
      }

      .add-btn:disabled,
      .remove-btn:disabled {
        cursor: not-allowed;
        opacity: 0.65;
        transform: none;
      }

      .grid {
        display: grid;
        gap: 0.65rem;
      }

      .header,
      .row {
        display: grid;
        grid-template-columns: minmax(10rem, 1.4fr) minmax(7rem, 1fr) auto;
        gap: 0.65rem;
        align-items: center;
      }

      .header {
        padding: 0 0.15rem;
        color: var(--mlf-time-series-heading, var(--mlf-color-text-muted, #475569));
        font-size: 0.72rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .row {
        padding: 0.55rem;
        border-radius: 1rem;
        background: var(
          --mlf-time-series-row-bg,
          color-mix(
            in srgb,
            var(--mlf-color-surface, #ffffff) 80%,
            var(--mlf-color-bg-light, #f8fafc)
          )
        );
        border: var(--mlf-border-width, 1px) solid
          var(
            --mlf-time-series-row-border,
            color-mix(in srgb, var(--mlf-color-border, #e2e8f0) 90%, transparent)
          );
      }

      .cell {
        position: relative;
        min-width: fit-content;
      }

      .value-wrap {
        position: relative;
      }

      .value-wrap input {
        padding-right: calc(var(--mlf-time-series-unit-width, 2rem) + 1.8rem);
      }

      .unit {
        position: absolute;
        top: 50%;
        right: 0.85rem;
        transform: translateY(-50%);
        max-width: 42%;
        overflow: hidden;
        color: var(--mlf-time-series-unit-color, var(--mlf-color-text-muted, #475569));
        font-size: 0.82rem;
        font-weight: 700;
        text-overflow: ellipsis;
        white-space: nowrap;
        pointer-events: none;
      }

      .unit:empty {
        display: none;
      }

      .empty {
        padding: 0.95rem 1rem;
        border-radius: 0.9rem;
        border: 1px dashed var(--mlf-time-series-empty-border, var(--mlf-color-border, #cbd5e1));
        color: var(--mlf-time-series-empty-text, var(--mlf-color-text-muted, #475569));
        font-size: 0.9rem;
      }

      @media (max-width: 640px) {
        .header {
          display: none;
        }

        .row {
          grid-template-columns: 1fr;
        }

        .remove-btn {
          justify-self: end;
        }
      }
    `,
  ];

  @state() private accessor rows: DraftRow[] = [];
  #rowsDirtySinceCommit = false;

  protected willUpdate(changedProperties: Map<string, unknown>): void {
    super.willUpdate(changedProperties);

    if (changedProperties.has("descriptor")) {
      this.#syncRowsFromDescriptor();
    }
  }

  render() {
    const props = this.props;
    const context = this.fieldContext;
    const granularity = this.#granularity;
    const disabled = Boolean(this.fieldContext?.disabled);
    const readOnly = Boolean(this.fieldContext?.readOnly);
    const locked = disabled || readOnly;
    const unit = typeof props.unit === "string" ? props.unit : "";
    const minValue = typeof props.minValue === "number" ? props.minValue : undefined;
    const maxValue = typeof props.maxValue === "number" ? props.maxValue : undefined;
    const unitWidth = `${Math.max(unit.length * 0.56 + 0.8, 2.3)}rem`;
    const text = this.text;

    return html`
      <div class="series" style=${`--mlf-time-series-unit-width: ${unitWidth};`}>
        <div class="toolbar">
          <button
            class="add-btn"
            type="button"
            aria-label=${text.timeSeriesAddRow}
            ?disabled=${locked}
            @click=${this.#handleAddRow}
          >
            ${text.timeSeriesAddRow}
          </button>
        </div>

        ${this.rows.length > 0
          ? html`
              <div class="grid">
                <div class="header" aria-hidden="true">
                  <div>${text.timeSeriesTimestamp}</div>
                  <div>${text.timeSeriesValue}</div>
                  <div></div>
                </div>
                ${this.rows.map((row, index) => {
                  const timestampId = `${context?.controlId ?? "mlf-time-series"}-${row.key}-timestamp`;
                  const valueId = `${context?.controlId ?? "mlf-time-series"}-${row.key}-value`;

                  return html`
                    <div class="row">
                      <div class="cell">
                        <input
                          class="control"
                          id=${timestampId}
                          type=${granularity === "datetime" ? "datetime-local" : "date"}
                          .value=${row.timestamp}
                          aria-label=${`${context?.label ?? toText(props.label)} ${text.timeSeriesTimestamp} ${index + 1}`}
                          aria-describedby=${ifDefined(context?.describedBy)}
                          aria-invalid=${String(context?.invalid ?? false)}
                          ?required=${Boolean(props.required)}
                          ?disabled=${disabled}
                          ?readonly=${readOnly}
                          min=${ifDefined(
                            typeof props.minDate === "string" ? props.minDate : undefined,
                          )}
                          max=${ifDefined(
                            typeof props.maxDate === "string" ? props.maxDate : undefined,
                          )}
                          @input=${(event: Event) => this.#handleTimestampInput(index, event)}
                          @blur=${this.#handleBlur}
                        />
                      </div>
                      <div class="cell value-wrap">
                        <input
                          class="control"
                          id=${valueId}
                          type="text"
                          inputmode="decimal"
                          spellcheck="false"
                          autocomplete="off"
                          .value=${row.value}
                          aria-label=${`${context?.label ?? toText(props.label)} ${text.timeSeriesValue} ${index + 1}`}
                          aria-describedby=${ifDefined(context?.describedBy)}
                          aria-invalid=${String(context?.invalid ?? false)}
                          aria-valuemin=${ifDefined(minValue)}
                          aria-valuemax=${ifDefined(maxValue)}
                          ?required=${Boolean(props.required)}
                          ?disabled=${disabled}
                          ?readonly=${readOnly}
                          @input=${(event: Event) => this.#handleValueInput(index, event)}
                          @blur=${this.#handleBlur}
                        />
                        <span class="unit" aria-hidden="true">${unit}</span>
                      </div>
                      <button
                        class="remove-btn"
                        type="button"
                        aria-label=${`${text.timeSeriesRemoveRow} ${index + 1}`}
                        ?disabled=${locked}
                        @click=${() => this.#handleRemoveRow(index)}
                      >
                        &times;
                      </button>
                    </div>
                  `;
                })}
              </div>
            `
          : html`<div class="empty">${text.timeSeriesEmpty}</div>`}
      </div>
      ${this.renderAssistiveText()}
    `;
  }

  get #granularity(): "date" | "datetime" {
    return this.props.granularity === "datetime" ? "datetime" : "date";
  }

  get #orderedDirection(): "asc" | "desc" | false {
    return this.props.ordered === "desc" ? "desc" : this.props.ordered === false ? false : "asc";
  }

  #syncRowsFromDescriptor(): void {
    this.rows = normalizeRows(this.props.value, this.#granularity);
    this.#rowsDirtySinceCommit = false;
  }

  #handleTimestampInput(index: number, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.rows = this.rows.map((row, rowIndex) =>
      rowIndex === index ? { ...row, timestamp: value } : row,
    );
    this.#rowsDirtySinceCommit = true;
  }

  #handleValueInput(index: number, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.rows = this.rows.map((row, rowIndex) => (rowIndex === index ? { ...row, value } : row));
    this.#rowsDirtySinceCommit = true;
    // Commit on every value change so engine runs syncErrors live.
    // Timestamp inputs are NOT committed live because partial date strings
    // cause the row to be filtered out by normalizeTimeSeriesPoint.
    this.#commitRows();
  }

  #handleAddRow = (): void => {
    const row: DraftRow = {
      key: createRowKey(),
      timestamp: createDefaultTimestamp(this.rows, this.#granularity, this.#orderedDirection),
      value: "",
    };

    this.rows = [...this.rows, row];
    this.#rowsDirtySinceCommit = true;
    this.#commitRows();
  };

  #handleRemoveRow(index: number): void {
    this.rows = this.rows.filter((_, rowIndex) => rowIndex !== index);
    this.#rowsDirtySinceCommit = true;
    this.#commitRows();
  }

  #handleBlur = (): void => {
    this.#commitRows();
    this.commitBlur();
  };

  #commitRows(): void {
    if (!this.#rowsDirtySinceCommit) {
      return;
    }

    this.commitValue(
      this.rows
        .filter((row) => row.timestamp.length > 0)
        .map((row) => ({
          timestamp: row.timestamp,
          value: row.value === "" ? null : row.value,
        })),
    );
    this.#rowsDirtySinceCommit = false;
  }
}
