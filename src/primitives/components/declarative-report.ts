// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { css, html } from "lit";
import { customElement } from "lit/decorators.js";
import type { PresentationNode, PresentationSummary } from "@/presentation";
import { PrimitiveReportElement } from "../base-report-element";
import { primitiveTagNames } from "../constants";
import { renderPresentationNodes, renderPresentationSummary } from "./presentation";

@customElement(primitiveTagNames.declarativeReport)
export class PrimitiveDeclarativeReportElement extends PrimitiveReportElement {
  static styles = [
    PrimitiveReportElement.styles,
    css`
      :host {
        display: block;
      }

      .summary,
      .node {
        display: grid;
        gap: 0.45rem;
        padding: 1rem 1.1rem;
        border: var(--mlf-border-width, 1px) solid
          color-mix(in srgb, var(--mlf-color-border, #e2e8f0) 82%, transparent);
        border-radius: 1rem;
        background: color-mix(in srgb, var(--mlf-color-surface, #ffffff) 88%, transparent);
      }

      .presentation {
        display: grid;
        gap: 0.85rem;
      }

      .summary {
        grid-template-columns: minmax(0, 1fr) auto;
        align-items: start;
      }

      .summary-copy,
      .summary-meta {
        display: grid;
        gap: 0.35rem;
      }

      .summary-title,
      .node-label,
      .metric-value,
      .summary-value {
        margin: 0;
      }

      .summary-title,
      .node-label {
        font-size: 0.78rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--mlf-color-text-muted, #475569);
      }

      .summary-description,
      .node-text,
      .node-hint {
        margin: 0;
      }

      .metric-value,
      .summary-value {
        font-size: 1.2rem;
        font-weight: 700;
        color: var(--mlf-color-text, #0f172a);
      }

      .node-list,
      .kv-list {
        margin: 0;
        padding-left: 1.15rem;
      }

      .kv-list {
        display: grid;
        gap: 0.55rem;
        padding-left: 0;
      }

      .kv-row {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 1rem;
      }

      .kv-row dt,
      .kv-row dd {
        margin: 0;
      }

      .table-wrap {
        overflow-x: auto;
      }

      table {
        width: 100%;
        border-collapse: collapse;
      }

      th,
      td {
        padding: 0.65rem 0.75rem;
        border-bottom: 1px solid
          color-mix(in srgb, var(--mlf-color-border, #e2e8f0) 82%, transparent);
        text-align: left;
        vertical-align: top;
      }

      th {
        font-size: 0.78rem;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: var(--mlf-color-text-muted, #475569);
      }

      .badge-row {
        display: flex;
        align-items: center;
      }

      .badge {
        display: inline-flex;
        align-items: center;
        min-height: 1.8rem;
        padding: 0.25rem 0.65rem;
        border-radius: 999px;
        font-size: 0.72rem;
        font-weight: 700;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        background: color-mix(in srgb, var(--mlf-color-accent, #1e40af) 12%, transparent);
      }

      .tone-danger {
        border-color: color-mix(in srgb, var(--mlf-color-danger, #dc2626) 40%, transparent);
      }

      .tone-success {
        border-color: color-mix(in srgb, var(--mlf-color-success, #059669) 40%, transparent);
      }

      .tone-warning {
        border-color: color-mix(in srgb, #d97706 40%, transparent);
      }

      pre {
        margin: 0;
        overflow-x: auto;
        white-space: pre-wrap;
      }
    `,
  ];

  render() {
    const props = this.props;
    const nodes = Array.isArray(props.content) ? (props.content as PresentationNode[]) : [];
    const summary =
      props.summary && typeof props.summary === "object"
        ? (props.summary as PresentationSummary)
        : null;

    return html`
      ${renderPresentationSummary(summary, this.reportContext?.label)}
      ${renderPresentationNodes(nodes)}
    `;
  }
}
