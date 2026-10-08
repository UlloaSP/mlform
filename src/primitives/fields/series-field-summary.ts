// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { css, html, nothing } from "lit";
import { toText } from "../utils";

type AggregationResult = { label: string; value: number | null; unit?: string };

export const renderSeriesSummary = (results: unknown) => {
  if (!Array.isArray(results) || results.length === 0) return nothing;
  return html`
    <dl class="aggregation-summary" aria-live="polite" aria-atomic="true">
      ${(results as AggregationResult[]).map(
        (result) => html`
          <div class="aggregation-result">
            <dt>${result.label}</dt>
            <dd>
              ${result.value === null ? "—" : result.value}
              ${result.value === null ? nothing : html`<span>${toText(result.unit)}</span>`}
            </dd>
          </div>
        `,
      )}
    </dl>
  `;
};

export const seriesSummaryStyles = css`
  .aggregation-summary {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 10rem), 1fr));
    gap: 0.85rem 1.25rem;
    margin: 0;
    padding-block-start: 1rem;
    border-block-start: var(--mlf-border-width, 1px) solid var(--mlf-color-border, #cbd5e1);
  }

  .aggregation-result {
    min-width: 0;
    overflow-wrap: anywhere;
  }

  .aggregation-result dt,
  .aggregation-result dd span {
    color: var(--mlf-color-text-muted, #475569);
    font-size: 0.85rem;
  }

  .aggregation-result dd {
    margin: 0.25rem 0 0;
    color: var(--mlf-color-text, #0f172a);
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }

  @media (forced-colors: active) {
    .aggregation-summary {
      border-color: CanvasText;
    }
    .aggregation-result dt,
    .aggregation-result dd,
    .aggregation-result dd span {
      color: CanvasText;
    }
  }
`;
