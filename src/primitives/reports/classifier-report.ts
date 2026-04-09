// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { css, html } from "lit";
import { customElement } from "lit/decorators.js";
import { PrimitiveReportElement } from "../base-report-element";
import { primitiveStaticText, primitiveTagNames } from "../constants";
import { isRecord, toText } from "../utils";

type ProbabilityRow = {
  label: string;
  value: number;
};

const toProbabilityRows = (payload: unknown, labelsOverride: unknown): ProbabilityRow[] => {
  if (!isRecord(payload) || !Array.isArray(payload.probabilities)) {
    return [];
  }

  const labelsFromProps = Array.isArray(labelsOverride) ? labelsOverride : payload.labels;
  const labels = Array.isArray(labelsFromProps) ? labelsFromProps : [];

  return payload.probabilities
    .map((value, index) => {
      const numeric = typeof value === "number" ? value : Number(value);
      if (Number.isNaN(numeric)) {
        return null;
      }

      return {
        label:
          typeof labels[index] === "string"
            ? labels[index]
            : primitiveStaticText.classifierClassLabel(index),
        value: numeric,
      } satisfies ProbabilityRow;
    })
    .filter((row): row is ProbabilityRow => row !== null);
};

@customElement(primitiveTagNames.classifierReport)
export class PrimitiveClassifierReportElement extends PrimitiveReportElement {
  static styles = [
    PrimitiveReportElement.styles,
    css`
      .rows {
        display: grid;
        gap: 0.5rem;
      }

      .item {
        display: grid;
        grid-template-columns: minmax(6rem, 120px) 1fr 56px;
        gap: 0.75rem;
        align-items: center;
      }

      .label {
        font-size: 0.9rem;
        font-weight: 500;
        color: var(--mlf-color-text, #0f172a);
        text-transform: capitalize;
        text-align: right;
      }

      .bar {
        position: relative;
        width: 100%;
        height: 10px;
        overflow: hidden;
        border-radius: 5px;
        background: var(--mlf-chart-track-bg, var(--mlf-color-border, #e2e8f0));
      }

      .bar::after {
        content: "";
        position: absolute;
        inset: 0;
        width: var(--w);
        background: linear-gradient(
          90deg,
          var(--mlf-chart-fill-start, var(--mlf-color-accent, #1e40af)) 0%,
          var(--mlf-chart-fill-end, var(--mlf-color-accent-hover, #1d4ed8)) 100%
        );
        border-radius: inherit;
        transition: width 0.3s ease;
      }

      .pct {
        font-size: 0.9rem;
        color: var(--mlf-color-text, #0f172a);
        text-align: right;
        font-variant-numeric: tabular-nums;
      }

      .compact {
        padding: 1rem;
        border-radius: 12px;
        border: var(--mlf-border-width, 1px) solid
          var(--mlf-report-compact-border, var(--mlf-color-border, #e2e8f0));
        background: var(--mlf-report-compact-bg, var(--mlf-color-surface, #ffffff));
        color: var(--mlf-color-text, #0f172a);
        font-size: 1rem;
        font-weight: 600;
      }

      .error {
        color: var(--mlf-color-danger, #dc2626);
        line-height: 1.5;
      }
    `,
  ];

  render() {
    const payload = this.props.payload;
    const error = typeof this.props.error === "string" ? this.props.error : null;
    const context = this.reportContext;
    const details = this.props.details !== false;

    if (error) {
      return html`<div class="error">${error}</div>`;
    }

    if (payload === null || payload === undefined) {
      return html`<div class="empty">${primitiveStaticText.classifierEmpty}</div>`;
    }

    const prediction = isRecord(payload)
      ? (payload.prediction ??
        payload.className ??
        payload.label ??
        primitiveStaticText.classifierUnknownPrediction)
      : payload;
    const rows = toProbabilityRows(payload, this.props.labels);

    return html`
      <section
        part="classifier-report"
        id=${context?.regionId ?? ""}
        aria-label=${context?.label ?? primitiveStaticText.classifierAriaLabel}
      >
        ${details && rows.length > 0
          ? html`
              <div class="rows">
                ${rows.map((row) => {
                  const width = `${Math.max(0, Math.min(row.value, 1)) * 100}%`;
                  return html`
                    <div class="item">
                      <div class="label">${row.label}</div>
                      <div class="bar" style=${`--w: ${width};`} aria-hidden="true"></div>
                      <div class="pct">${(row.value * 100).toFixed(1)}%</div>
                    </div>
                  `;
                })}
              </div>
            `
          : html`
              <div class="compact">
                ${toText(prediction, primitiveStaticText.classifierUnknownPrediction)}
              </div>
            `}
      </section>
    `;
  }
}
