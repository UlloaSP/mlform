// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { html } from "lit";
import { customElement, state } from "lit/decorators.js";
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
import { renderSeriesCell } from "./series-field-renderers";
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
    return renderSeriesCell({
      config,
      value,
      index,
      id,
      disabled,
      readOnly,
      field,
      context,
      text: this.text,
      onInput: (rowIndex, targetField, nextValue) =>
        this.#handleCellInput(rowIndex, targetField, nextValue),
      onBlur: this.#handleBlur,
      label,
    });
  }
}
