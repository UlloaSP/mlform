// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { html } from "lit";
import { customElement, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { PrimitiveFieldElement } from "../base-field-element";
import { primitiveTagNames } from "../constants";
import { toText } from "../utils";
import {
  createRowKey,
  normalizeRows,
  seriesNumberUnit,
  type DraftRow,
  type SeriesSubFieldConfig,
} from "./series-field-helpers";
import { renderSeriesCell } from "./series-field-renderers";
import { seriesFieldStyles } from "./series-field-styles";

const commitCellValue = (value: unknown): unknown => (value === "" ? null : value);

@customElement(primitiveTagNames.seriesField)
export class PrimitiveSeriesFieldElement extends PrimitiveFieldElement {
  static styles = [PrimitiveFieldElement.styles, seriesFieldStyles];

  @state() private accessor rows: DraftRow[] = [];
  #rowsDirtySinceCommit = false;
  #pendingFocus:
    | { kind: "row"; index: number }
    | { kind: "remove"; index: number; target: "remove" | "add" | "control" }
    | null = null;

  protected willUpdate(changedProperties: Map<string, unknown>): void {
    super.willUpdate(changedProperties);

    if (changedProperties.has("descriptor")) {
      this.#syncRowsFromDescriptor();
    }
  }

  protected updated(): void {
    this.#applyPendingFocus();
  }

  render() {
    const context = this.fieldContext;
    const disabled = Boolean(this.fieldContext?.disabled);
    const readOnly = Boolean(this.fieldContext?.readOnly);
    const locked = disabled || readOnly;
    const field1 = this.#field1Config;
    const field2 = this.#field2Config;
    const canAdd = this.#canAddRow;
    const canRemove = this.#canRemoveRow;
    const unitWidth = `${Math.max(seriesNumberUnit(field2).length * 0.56 + 0.8, 2.3)}rem`;
    const text = this.text;

    return html`
      <div
        class="series"
        style=${`--mlf-series-unit-width: ${unitWidth};`}
        role="group"
        tabindex="-1"
        aria-label=${context?.label ?? toText(this.props.label)}
        aria-describedby=${ifDefined(context?.describedBy)}
        aria-invalid=${String(context?.invalid ?? false)}
      >
        <div class="toolbar">
          <button
            class="add-btn"
            type="button"
            aria-label=${text.seriesAddRow}
            ?disabled=${locked || !canAdd}
            @click=${this.#handleAddRow}
          >
            ${text.seriesAddRow}
          </button>
        </div>

        ${
          this.rows.length > 0
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
                          ?disabled=${locked || !canRemove}
                          @click=${() => this.#handleRemoveRow(index)}
                        >
                          &times;
                        </button>
                      </div>
                    `;
                  })}
                </div>
              `
            : html`<div class="empty">${text.seriesEmpty}</div>`
        }
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

  get #canAddRow(): boolean {
    const maxPoints = this.props.maxPoints;
    return typeof maxPoints !== "number" || this.rows.length < maxPoints;
  }

  get #canRemoveRow(): boolean {
    const minPoints = this.props.minPoints;
    return typeof minPoints !== "number" || this.rows.length > minPoints;
  }

  #syncRowsFromDescriptor(): void {
    this.rows = normalizeRows(this.props.value, this.#field1Config, this.#field2Config);
    this.#rowsDirtySinceCommit = false;
  }

  #handleAddRow = (): void => {
    if (!this.#canAddRow) return;
    this.#pendingFocus = { kind: "row", index: this.rows.length };
    this.rows = [...this.rows, { key: createRowKey(), field1: "", field2: "" }];
    this.#rowsDirtySinceCommit = true;
    this.#commitRows();
  };

  #handleRemoveRow(index: number): void {
    if (!this.#canRemoveRow) return;
    const nextLength = this.rows.length - 1;
    const minPoints = this.props.minPoints;
    const maxPoints = this.props.maxPoints;
    const canRemove = typeof minPoints !== "number" || nextLength > minPoints;
    const canAdd = typeof maxPoints !== "number" || nextLength < maxPoints;
    this.#pendingFocus = {
      kind: "remove",
      index,
      target: canRemove ? "remove" : canAdd ? "add" : "control",
    };
    this.rows = this.rows.filter((_, rowIndex) => rowIndex !== index);
    this.#rowsDirtySinceCommit = true;
    this.#commitRows();
  }

  #applyPendingFocus(): void {
    const pending = this.#pendingFocus;
    if (!pending) return;
    if (this.fieldContext?.disabled || this.fieldContext?.readOnly) {
      this.#pendingFocus = null;
      return;
    }

    const target =
      pending.kind === "row"
        ? this.renderRoot.querySelectorAll<HTMLElement>(".row .control").item(pending.index * 2)
        : pending.target === "remove"
          ? this.renderRoot
              .querySelectorAll<HTMLButtonElement>(".remove-btn:not(:disabled)")
              .item(Math.min(pending.index, this.rows.length - 1))
          : pending.target === "add"
            ? this.renderRoot.querySelector<HTMLButtonElement>(".add-btn:not(:disabled)")
            : (this.renderRoot.querySelector<HTMLElement>(".row .control:not(:disabled)") ??
              this.renderRoot.querySelector<HTMLElement>(".series"));

    if (!target) return;
    target.focus();
    this.#pendingFocus = null;
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
        field1: commitCellValue(row.field1),
        field2: commitCellValue(row.field2),
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
