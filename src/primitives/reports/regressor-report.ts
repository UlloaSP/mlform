// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { css, html } from "lit";
import { customElement } from "lit/decorators.js";
import { PrimitiveReportElement } from "../base-report-element";
import { isRecord } from "../utils";

const formatValue = (value: unknown, precision: number, unit: string): string => {
  if (typeof value === "number") {
    return `${value.toFixed(precision)}${unit ? ` ${unit}` : ""}`;
  }

  const numeric = Number(value);
  if (!Number.isNaN(numeric)) {
    return `${numeric.toFixed(precision)}${unit ? ` ${unit}` : ""}`;
  }

  return String(value);
};

const toValues = (payload: unknown): number[] => {
  if (isRecord(payload) && Array.isArray(payload.values)) {
    return payload.values.map((value) => Number(value)).filter((value) => !Number.isNaN(value));
  }

  if (isRecord(payload) && "value" in payload) {
    const numeric = Number(payload.value);
    return Number.isNaN(numeric) ? [] : [numeric];
  }

  const numeric = Number(payload);
  return Number.isNaN(numeric) ? [] : [numeric];
};

const toInterval = (payload: unknown): [number, number] | null => {
  if (isRecord(payload) && Array.isArray(payload.interval) && payload.interval.length === 2) {
    const min = Number(payload.interval[0]);
    const max = Number(payload.interval[1]);
    if (!Number.isNaN(min) && !Number.isNaN(max)) {
      return [min, max];
    }
  }

  if (isRecord(payload) && typeof payload.min === "number" && typeof payload.max === "number") {
    return [payload.min, payload.max];
  }

  return null;
};

const buildGradient = (min: number, max: number): string => {
  if (max <= min) {
    return "linear-gradient(to right, #ffea00 0%, #00c853 50%, #ffea00 100%)";
  }

  const delta = max - min;
  const barMin = min - delta;
  const barMax = max + delta;
  const calcPercent = (value: number) => ((value - barMin) / (barMax - barMin)) * 100;
  const pctMin = calcPercent(min);
  const pctMax = calcPercent(max);
  const pctMid = calcPercent((min + max) / 2);
  const transitionBand = 10;
  const beforeMin = Math.max(pctMin - transitionBand, 0);
  const afterMax = Math.min(pctMax + transitionBand, 100);

  return `linear-gradient(to right,
    #c62828 0%,
    #ff6d00 ${beforeMin}%,
    #ffea00 ${pctMin}%,
    #00c853 ${pctMid}%,
    #ffea00 ${pctMax}%,
    #ff6d00 ${afterMax}%,
    #c62828 100%)`;
};

const clampPercent = (value: number, min: number, max: number): number => {
  if (max <= min) {
    return 49;
  }

  const delta = max - min;
  const barMin = min - delta;
  const barMax = max + delta;
  return Math.min(Math.max(((value - barMin) / (barMax - barMin)) * 100, 0), 98.45);
};

@customElement("mlf-regressor-report")
export class PrimitiveRegressorReportElement extends PrimitiveReportElement {
  static styles = [
    PrimitiveReportElement.styles,
    css`
      :host {
        --marker-size: 14px;
        --limit-line-width: 3px;
        --limit-line-height: 28px;
      }

      .value {
        display: flex;
        justify-content: flex-end;
        font-size: 1rem;
        font-weight: 700;
        color: var(--mlf-color-text, #0f172a);
        margin-bottom: 5px;
      }

      .item + .item {
        margin-top: 1rem;
      }

      .bar-wrapper {
        position: relative;
        height: 16px;
        border-radius: 5px;
      }

      .value-marker {
        position: absolute;
        top: 10%;
        height: var(--marker-size);
        width: var(--marker-size);
        border-radius: 50%;
        background: radial-gradient(
          circle,
          var(--mlf-color-accent, #1e40af),
          var(--mlf-color-accent-hover, #1d4ed8)
        );
      }

      .limit-wrapper {
        position: absolute;
        top: -12px;
        transform: translateX(-50%);
        display: flex;
        flex-direction: column;
        align-items: center;
        pointer-events: none;
        z-index: 2;
      }

      .limit-line {
        width: var(--limit-line-width);
        height: var(--limit-line-height);
        background: var(--mlf-color-text, #0f172a);
        opacity: 0.6;
      }

      .limit-label {
        margin-top: 4px;
        font-size: 0.75rem;
        color: var(--mlf-color-secondary, #475569);
        white-space: nowrap;
      }

      .meta {
        margin-top: 1rem;
        color: var(--mlf-color-secondary, #475569);
        font-size: 0.82rem;
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

    if (error) {
      return html`<div class="error">${error}</div>`;
    }

    if (payload === null || payload === undefined) {
      return html`<div class="empty">No regression output yet.</div>`;
    }

    const unit = typeof this.props.unit === "string" ? this.props.unit : "";
    const precision =
      typeof this.props.precision === "number" && this.props.precision >= 0
        ? this.props.precision
        : 2;
    const values = toValues(payload);
    const interval = toInterval(payload);
    const executionTime =
      isRecord(payload) && typeof payload.execution_time === "number"
        ? `${payload.execution_time} ms`
        : null;

    return html`
      <section
        part="regressor-report"
        id=${context?.regionId ?? ""}
        aria-label=${context?.label ?? "Regressor report"}
      >
        ${values.length > 0
          ? values.map(
              (value) => html`
                <div class="item">
                  <div class="value">${formatValue(value, precision, unit)}</div>

                  ${interval
                    ? html`
                        <div
                          class="bar-wrapper"
                          style=${`background: ${buildGradient(interval[0], interval[1])};`}
                        >
                          <div
                            class="limit-wrapper"
                            style=${`left: ${clampPercent(interval[0], interval[0], interval[1])}%;`}
                          >
                            <div class="limit-line"></div>
                            <div class="limit-label">
                              ${formatValue(interval[0], precision, unit)}
                            </div>
                          </div>

                          <div
                            class="limit-wrapper"
                            style=${`left: ${clampPercent(interval[1], interval[0], interval[1])}%;`}
                          >
                            <div class="limit-line"></div>
                            <div class="limit-label">
                              ${formatValue(interval[1], precision, unit)}
                            </div>
                          </div>

                          <span
                            class="value-marker"
                            style=${`left: ${clampPercent(value, interval[0], interval[1])}%;`}
                          ></span>
                        </div>
                      `
                    : html``}
                </div>
              `,
            )
          : html`<div class="value">${formatValue(payload, precision, unit)}</div>`}
        ${executionTime ? html`<div class="meta">Execution time: ${executionTime}</div>` : html``}
      </section>
    `;
  }
}
