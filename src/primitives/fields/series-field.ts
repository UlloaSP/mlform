// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { html } from "lit";
import { customElement, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { PrimitiveFieldElement } from "../base-field-element";
import { primitiveTagNames } from "../constants";
import { toText } from "../utils";
import {
  commitSeriesCellValue,
  createRowKey,
  normalizeRows,
  seriesNumberUnit,
  type DraftRow,
  type SeriesSubFieldConfig,
} from "./series-field-helpers";
import { seriesFieldStyles } from "./series-field-styles";

@customElement(primitiveTagNames.seriesField)
export class PrimitiveSeriesFieldElement extends PrimitiveFieldElement {
  static styles = [PrimitiveFieldElement.styles, seriesFieldStyles];

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
    const unitWidth = `${Math.max(seriesNumberUnit(field2).length * 0.56 + 0.8, 2.3)}rem`;
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
        field1: commitSeriesCellValue(this.#field1Config, row.field1),
        field2: commitSeriesCellValue(this.#field2Config, row.field2),
      })),
    );
    this.#rowsDirtySinceCommit = false;
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
        const unit = seriesNumberUnit(config);
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
