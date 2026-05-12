// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { css, html } from "lit";
import { customElement } from "lit/decorators.js";
import type { PresentationNode, PresentationSummary } from "@/runtime";
import { PrimitiveExplanationElement } from "../base-explanation-element";
import { primitiveTagNames } from "../constants";
import { toText } from "../utils";
import { renderPresentationNodes, renderPresentationSummary } from "./presentation";

@customElement(primitiveTagNames.declarativeExplanation)
export class PrimitiveDeclarativeExplanationElement extends PrimitiveExplanationElement {
  static styles = [
    PrimitiveExplanationElement.styles,
    css`
      :host {
        display: block;
      }

      .summary,
      .node {
        display: grid;
        gap: 0.45rem;
        padding: 0.95rem 1rem;
        border: var(--mlf-border-width, 1px) solid
          color-mix(in srgb, var(--mlf-color-border, #e2e8f0) 82%, transparent);
        border-radius: 1rem;
        background: color-mix(in srgb, var(--mlf-color-surface, #ffffff) 88%, transparent);
      }

      .presentation {
        display: grid;
        gap: 0.8rem;
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
      .summary-value,
      .node-label,
      .node-text,
      .node-hint,
      .metric-value {
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

      .summary-value,
      .metric-value {
        font-size: 1.1rem;
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

      .chromeless-text {
        margin: 0;
        white-space: pre-wrap;
        color: var(--mlf-color-text, #0f172a);
      }
    `,
  ];

  render() {
    const props = this.props;
    const nodes = Array.isArray(props.content) ? (props.content as PresentationNode[]) : [];
    const chromeless = props.chromeless === true;
    const chromelessTextNode =
      chromeless && nodes.length === 1 && nodes[0]?.type === "text" && !nodes[0].label
        ? nodes[0]
        : null;
    const summary =
      !chromeless && props.summary && typeof props.summary === "object"
        ? (props.summary as PresentationSummary)
        : null;

    if (chromelessTextNode) {
      return html`<pre class="chromeless-text">${toText(chromelessTextNode.value)}</pre>`;
    }

    return html`
      ${renderPresentationSummary(summary, chromeless ? undefined : this.explanationContext?.label)}
      ${renderPresentationNodes(nodes)}
    `;
  }
}
