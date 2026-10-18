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
  type DraftRow,
  type SeriesColumnConfig,
} from "./series-field-helpers";
import { renderSeriesCell } from "./series-field-renderers";
import { seriesFieldStyles } from "./series-field-styles";
import { renderSeriesSummary, seriesSummaryStyles } from "./series-field-summary";

const commitCellValue = (value: unknown): unknown => (value === "" ? null : value);

@customElement(primitiveTagNames.seriesField)
export class PrimitiveSeriesFieldElement extends PrimitiveFieldElement {
  static styles = [PrimitiveFieldElement.styles, seriesFieldStyles, seriesSummaryStyles];

  @state() private accessor rows: DraftRow[] = [];
  #rowsDirtySinceCommit = false;
  #committedKey = "";
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
    const columns = this.#columns;
    const canAdd = this.#canAddRow;
    const canRemove = this.#canRemoveRow;
    const text = this.text;

    return html`
      <div
        class="series"
        style=${`--mlf-series-column-count: ${columns.length};`}
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
                <div
                  class="grid"
                  data-columns=${columns.length}
                  tabindex="0"
                  role="group"
                  aria-label=${context?.label ?? toText(this.props.label)}
                >
                  <div class="header" aria-hidden="true">
                    ${columns.map((column) => html`<div>${toText(column.label, column.id)}</div>`)}
                    <div></div>
                  </div>
                  ${this.rows.map((row, index) => {
                    return html`
                      <div class="row">
                        ${columns.map(
                          (column) => html`
                            <div class="cell">
                              <span class="cell-label" aria-hidden="true"
                                >${toText(column.label, column.id)}</span
                              >
                              ${this.#renderCell(
                                column,
                                row.values[column.id],
                                index,
                                `${context?.controlId ?? "mlf-series"}-${row.key}-${column.id}`,
                                disabled,
                                readOnly,
                              )}
                            </div>
                          `,
                        )}
                        <button
                          class="remove-btn"
                          type="button"
                          aria-label=${`${text.seriesRemoveRow} ${index + 1}`}
                          ?disabled=${locked || !canRemove}
                          @click=${() => this.#handleRemoveRow(index)}
                        >
                          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 10v7M14 10v7" />
                          </svg>
                        </button>
                      </div>
                    `;
                  })}
                </div>
              `
            : html`<div class="empty">${text.seriesEmpty}</div>`
        }
        ${renderSeriesSummary(this.props.aggregationResults)}
      </div>
      ${this.renderAssistiveText()}
    `;
  }

  get #columns(): SeriesColumnConfig[] {
    return Array.isArray(this.props.columns) ? (this.props.columns as SeriesColumnConfig[]) : [];
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
    const key = JSON.stringify(this.controller?.state.value ?? this.props.value);
    if (key === this.#committedKey) return;
    this.#committedKey = key;
    this.rows = normalizeRows(this.props.value, this.#columns);
    this.#rowsDirtySinceCommit = false;
  }

  #handleAddRow = (): void => {
    if (!this.#canAddRow) return;
    this.#pendingFocus = { kind: "row", index: this.rows.length };
    this.rows = [
      ...this.rows,
      {
        key: createRowKey(),
        values: Object.fromEntries(this.#columns.map((column) => [column.id, ""])),
      },
    ];
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
        ? this.renderRoot
            .querySelectorAll<HTMLElement>(".row")
            .item(pending.index)
            ?.querySelector<HTMLElement>(".control")
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

  #handleCellInput(index: number, columnId: string, value: unknown): void {
    this.rows = this.rows.map((row, rowIndex) =>
      rowIndex === index ? { ...row, values: { ...row.values, [columnId]: value } } : row,
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
      this.rows.map((row) =>
        Object.fromEntries(
          this.#columns.map((column) => [column.id, commitCellValue(row.values[column.id])]),
        ),
      ),
    );
    this.#committedKey = JSON.stringify(this.controller?.state.value ?? this.props.value);
    this.#rowsDirtySinceCommit = false;
  }

  #renderCell(
    config: SeriesColumnConfig,
    value: unknown,
    index: number,
    id: string,
    disabled: boolean,
    readOnly: boolean,
  ) {
    const context = this.fieldContext;
    const label = `${context?.label ?? toText(this.props.label)} ${toText(config.label, config.id)} ${index + 1}`;
    return renderSeriesCell({
      config,
      value,
      index,
      id,
      disabled,
      readOnly,
      columnId: config.id,
      context: context
        ? {
            ...context,
            invalid: Boolean(
              (this.props.cellErrors as Record<string, string[]>[] | undefined)?.[index]?.[
                config.id
              ]?.length,
            ),
          }
        : undefined,
      numericValue: (this.controller?.state.value as Record<string, unknown>[] | undefined)?.[
        index
      ]?.[config.id],
      text: this.text,
      onInput: (rowIndex, targetField, nextValue) =>
        this.#handleCellInput(rowIndex, targetField, nextValue),
      onBlur: this.#handleBlur,
      label,
    });
  }
}
