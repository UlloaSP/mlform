// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { css, html } from "lit";
import { customElement, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { PrimitiveFieldElement } from "../base-field-element";
import { primitiveTagNames } from "../constants";
import { toText } from "../utils";

type SeriesSubFieldConfig = {
  kind?: unknown;
  label?: unknown;
  required?: unknown;
  options?: unknown;
  min?: unknown;
  max?: unknown;
  step?: unknown;
  unit?: unknown;
  placeholder?: unknown;
  trueLabel?: unknown;
  falseLabel?: unknown;
};

type DraftRow = {
  key: string;
  field1: unknown;
  field2: unknown;
};

type SerializedPoint = {
  field1?: unknown;
  field2?: unknown;
};

let rowSequence = 0;

const createRowKey = (): string => `series-row-${++rowSequence}`;

const normalizeBooleanValue = (value: unknown): boolean | "" => {
  if (value === true || value === false) {
    return value;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return "";
};

const normalizeCellValue = (config: SeriesSubFieldConfig, value: unknown): unknown => {
  switch (config.kind) {
    case "number":
      return typeof value === "number" ? String(value) : typeof value === "string" ? value : "";
    case "date":
      return typeof value === "string" ? value : "";
    case "category":
    case "text":
      return typeof value === "string" ? value : "";
    case "boolean":
      return normalizeBooleanValue(value);
    default:
      return typeof value === "string" ? value : (value ?? "");
  }
};

const normalizeRows = (
  value: unknown,
  field1Config: SeriesSubFieldConfig,
  field2Config: SeriesSubFieldConfig,
): DraftRow[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((point) => {
    const row = point as SerializedPoint;
    return {
      key: createRowKey(),
      field1: normalizeCellValue(field1Config, row.field1),
      field2: normalizeCellValue(field2Config, row.field2),
    } satisfies DraftRow;
  });
};

@customElement(primitiveTagNames.seriesField)
export class PrimitiveSeriesFieldElement extends PrimitiveFieldElement {
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
          var(--mlf-series-action-border, var(--mlf-color-border, #cbd5e1));
        background: var(
          --mlf-series-action-bg,
          color-mix(in srgb, var(--mlf-color-accent, #1e40af) 9%, var(--mlf-color-surface, #ffffff))
        );
        color: var(--mlf-series-action-text, var(--mlf-color-text, #0f172a));
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
          --mlf-series-action-bg-hover,
          color-mix(
            in srgb,
            var(--mlf-color-accent, #1e40af) 16%,
            var(--mlf-color-surface, #ffffff)
          )
        );
        border-color: var(--mlf-series-action-border-hover, var(--mlf-color-accent, #1e40af));
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
        grid-template-columns: minmax(10rem, 1fr) minmax(10rem, 1fr) auto;
        gap: 0.65rem;
        align-items: start;
      }

      .header {
        padding: 0 0.15rem;
        color: var(--mlf-series-heading, var(--mlf-color-text-muted, #475569));
        font-size: 0.72rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .row {
        padding: 0.55rem;
        border-radius: 1rem;
        background: var(
          --mlf-series-row-bg,
          color-mix(
            in srgb,
            var(--mlf-color-surface, #ffffff) 80%,
            var(--mlf-color-bg-light, #f8fafc)
          )
        );
        border: var(--mlf-border-width, 1px) solid
          var(
            --mlf-series-row-border,
            color-mix(in srgb, var(--mlf-color-border, #e2e8f0) 90%, transparent)
          );
      }

      .cell {
        min-width: 0;
      }

      .cell select,
      .cell input {
        min-height: var(--mlf-control-height, 3rem);
      }

      .value-wrap {
        position: relative;
      }

      .value-wrap input {
        padding-right: calc(var(--mlf-series-unit-width, 2rem) + 1.8rem);
      }

      .unit {
        position: absolute;
        top: 50%;
        right: 0.85rem;
        transform: translateY(-50%);
        max-width: 42%;
        overflow: hidden;
        color: var(--mlf-series-unit-color, var(--mlf-color-text-muted, #475569));
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
        border: 1px dashed var(--mlf-series-empty-border, var(--mlf-color-border, #cbd5e1));
        color: var(--mlf-series-empty-text, var(--mlf-color-text-muted, #475569));
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
    const context = this.fieldContext;
    const disabled = Boolean(this.fieldContext?.disabled);
    const readOnly = Boolean(this.fieldContext?.readOnly);
    const locked = disabled || readOnly;
    const field1 = this.#field1Config;
    const field2 = this.#field2Config;
    const unitWidth = `${Math.max(this.#numberUnit(field2).length * 0.56 + 0.8, 2.3)}rem`;
    const text = this.text;

    return html`
      <div class="series" style=${`--mlf-series-unit-width: ${unitWidth};`}>
        <div class="toolbar">
          <button
            class="add-btn"
            type="button"
            aria-label=${text.seriesAddRow}
            ?disabled=${locked}
            @click=${this.#handleAddRow}
          >
            ${text.seriesAddRow}
          </button>
        </div>

        ${this.rows.length > 0
          ? html`
              <div class="grid">
                <div class="header" aria-hidden="true">
                  <div>${toText(field1.label, "field1")}</div>
                  <div>${toText(field2.label, "field2")}</div>
                  <div></div>
                </div>
                ${this.rows.map((row, index) => {
                  const field1Id = `${context?.controlId ?? "mlf-series"}-${row.key}-field1`;
                  const field2Id = `${context?.controlId ?? "mlf-series"}-${row.key}-field2`;

                  return html`
                    <div class="row">
                      <div class="cell">
                        ${this.#renderCell(
                          field1,
                          row.field1,
                          index,
                          field1Id,
                          disabled,
                          readOnly,
                          1,
                        )}
                      </div>
                      <div class="cell">
                        ${this.#renderCell(
                          field2,
                          row.field2,
                          index,
                          field2Id,
                          disabled,
                          readOnly,
                          2,
                        )}
                      </div>
                      <button
                        class="remove-btn"
                        type="button"
                        aria-label=${`${text.seriesRemoveRow} ${index + 1}`}
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
          : html`<div class="empty">${text.seriesEmpty}</div>`}
      </div>
      ${this.renderAssistiveText()}
    `;
  }

  get #field1Config(): SeriesSubFieldConfig {
    return (this.props.field1 as SeriesSubFieldConfig | undefined) ?? {};
  }

  get #field2Config(): SeriesSubFieldConfig {
    return (this.props.field2 as SeriesSubFieldConfig | undefined) ?? {};
  }

  #syncRowsFromDescriptor(): void {
    this.rows = normalizeRows(this.props.value, this.#field1Config, this.#field2Config);
    this.#rowsDirtySinceCommit = false;
  }

  #handleAddRow = (): void => {
    this.rows = [...this.rows, { key: createRowKey(), field1: "", field2: "" }];
    this.#rowsDirtySinceCommit = true;
    this.#commitRows();
  };

  #handleRemoveRow(index: number): void {
    this.rows = this.rows.filter((_, rowIndex) => rowIndex !== index);
    this.#rowsDirtySinceCommit = true;
    this.#commitRows();
  }

  #handleCellInput(index: number, field: 1 | 2, value: unknown): void {
    this.rows = this.rows.map((row, rowIndex) =>
      rowIndex === index ? { ...row, [field === 1 ? "field1" : "field2"]: value } : row,
    );
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
      this.rows.map((row) => ({
        field1: this.#commitCellValue(this.#field1Config, row.field1),
        field2: this.#commitCellValue(this.#field2Config, row.field2),
      })),
    );
    this.#rowsDirtySinceCommit = false;
  }

  #commitCellValue(config: SeriesSubFieldConfig, value: unknown): unknown {
    switch (config.kind) {
      case "number":
      case "date":
      case "category":
      case "text":
        return value === "" ? null : value;
      case "boolean":
        return value === "" ? null : value;
      default:
        return value === "" ? null : value;
    }
  }

  #numberUnit(config: SeriesSubFieldConfig): string {
    return typeof config.unit === "string" ? config.unit : "";
  }

  #renderCell(
    config: SeriesSubFieldConfig,
    value: unknown,
    index: number,
    id: string,
    disabled: boolean,
    readOnly: boolean,
    field: 1 | 2,
  ) {
    const context = this.fieldContext;
    const label = `${context?.label ?? toText(this.props.label)} ${toText(config.label, `field${field}`)} ${index + 1}`;
    const required = Boolean(config.required);

    switch (config.kind) {
      case "date":
        return html`
          <input
            class="control"
            id=${id}
            type="date"
            .value=${typeof value === "string" ? value : ""}
            aria-label=${label}
            aria-describedby=${ifDefined(context?.describedBy)}
            aria-invalid=${String(context?.invalid ?? false)}
            ?required=${required}
            ?disabled=${disabled}
            ?readonly=${readOnly}
            min=${ifDefined(typeof config.min === "string" ? config.min : undefined)}
            max=${ifDefined(typeof config.max === "string" ? config.max : undefined)}
            @input=${(event: Event) =>
              this.#handleCellInput(index, field, (event.target as HTMLInputElement).value)}
            @blur=${this.#handleBlur}
          />
        `;
      case "category": {
        const options = Array.isArray(config.options) ? config.options : [];
        const selected = typeof value === "string" ? value : "";
        return html`
          <select
            class="control"
            id=${id}
            aria-label=${label}
            aria-describedby=${ifDefined(context?.describedBy)}
            aria-invalid=${String(context?.invalid ?? false)}
            ?required=${required}
            ?disabled=${Boolean(disabled || readOnly)}
            @change=${(event: Event) =>
              this.#handleCellInput(index, field, (event.target as HTMLSelectElement).value)}
            @blur=${this.#handleBlur}
          >
            <option value="" ?selected=${selected === ""}>
              &#8212; ${this.text.categoryPlaceholder} &#8212;
            </option>
            ${options.map((option) => {
              const normalized =
                typeof option === "string" ? { label: option, value: option } : option;
              return html`
                <option
                  value=${String(normalized.value)}
                  ?selected=${String(normalized.value) === selected}
                >
                  ${String(normalized.label)}
                </option>
              `;
            })}
          </select>
        `;
      }
      case "boolean": {
        const trueLabel = toText(config.trueLabel, this.text.booleanTrue);
        const falseLabel = toText(config.falseLabel, this.text.booleanFalse);
        const selected = value === true ? "true" : value === false ? "false" : "";
        return html`
          <select
            class="control"
            id=${id}
            aria-label=${label}
            aria-describedby=${ifDefined(context?.describedBy)}
            aria-invalid=${String(context?.invalid ?? false)}
            ?required=${required}
            ?disabled=${Boolean(disabled || readOnly)}
            @change=${(event: Event) => {
              const next = (event.target as HTMLSelectElement).value;
              this.#handleCellInput(index, field, next === "" ? "" : next === "true");
            }}
            @blur=${this.#handleBlur}
          >
            <option value="" ?selected=${selected === ""}>&#8212; Select &#8212;</option>
            <option value="true" ?selected=${selected === "true"}>${trueLabel}</option>
            <option value="false" ?selected=${selected === "false"}>${falseLabel}</option>
          </select>
        `;
      }
      case "number": {
        const unit = this.#numberUnit(config);
        return html`
          <div class="value-wrap">
            <input
              class="control"
              id=${id}
              type="text"
              inputmode="decimal"
              spellcheck="false"
              autocomplete="off"
              .value=${typeof value === "string" ? value : ""}
              placeholder=${toText(config.placeholder)}
              aria-label=${label}
              aria-describedby=${ifDefined(context?.describedBy)}
              aria-invalid=${String(context?.invalid ?? false)}
              aria-valuemin=${ifDefined(typeof config.min === "number" ? config.min : undefined)}
              aria-valuemax=${ifDefined(typeof config.max === "number" ? config.max : undefined)}
              ?required=${required}
              ?disabled=${disabled}
              ?readonly=${readOnly}
              @input=${(event: Event) =>
                this.#handleCellInput(index, field, (event.target as HTMLInputElement).value)}
              @blur=${this.#handleBlur}
            />
            <span class="unit" aria-hidden="true">${unit}</span>
          </div>
        `;
      }
      default:
        return html`
          <input
            class="control"
            id=${id}
            type="text"
            .value=${typeof value === "string"
              ? value
              : typeof value === "number" || typeof value === "boolean" || typeof value === "bigint"
                ? `${value}`
                : ""}
            placeholder=${toText(config.placeholder)}
            aria-label=${label}
            aria-describedby=${ifDefined(context?.describedBy)}
            aria-invalid=${String(context?.invalid ?? false)}
            ?required=${required}
            ?disabled=${disabled}
            ?readonly=${readOnly}
            @input=${(event: Event) =>
              this.#handleCellInput(index, field, (event.target as HTMLInputElement).value)}
            @blur=${this.#handleBlur}
          />
        `;
    }
  }
}
