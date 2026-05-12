// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { html, nothing, type TemplateResult } from "lit";
import type { PresentationNode, PresentationSummary } from "@/runtime";
import { toText } from "../utils";

const toneClass = (tone: unknown): string => {
  return typeof tone === "string" && tone.length > 0 ? `tone-${tone}` : "tone-neutral";
};

const renderValue = (value: unknown): string => {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint") {
    return String(value);
  }

  if (value === null || value === undefined) {
    return "";
  }

  try {
    return JSON.stringify(value);
  } catch {
    return Object.prototype.toString.call(value);
  }
};

const normalizeEntries = (
  entries: PresentationNode extends never
    ? never
    : Array<{ label: string; value: unknown }> | Record<string, unknown>,
): Array<{ label: string; value: unknown }> => {
  if (Array.isArray(entries)) {
    return entries;
  }

  return Object.entries(entries).map(([label, value]) => ({ label, value }));
};

const renderCellValue = (value: unknown): TemplateResult => {
  return html`<span>${renderValue(value)}</span>`;
};

const renderNode = (node: PresentationNode, index: number): TemplateResult => {
  switch (node.type) {
    case "text":
      if (typeof node.value === "string" && node.value.includes("\n")) {
        return html`
          <section class="node text ${toneClass(node.tone)}" data-node-index=${index}>
            ${node.label ? html`<p class="node-label">${node.label}</p>` : nothing}
            <pre class="node-text">${node.value}</pre>
          </section>
        `;
      }
      return html`
        <section class="node text ${toneClass(node.tone)}" data-node-index=${index}>
          ${node.label ? html`<p class="node-label">${node.label}</p>` : nothing}
          <p class="node-text">${renderValue(node.value)}</p>
        </section>
      `;
    case "metric":
      return html`
        <section class="node metric ${toneClass(node.tone)}" data-node-index=${index}>
          <p class="node-label">${node.label}</p>
          <p class="metric-value">${renderValue(node.value)}</p>
          ${node.hint ? html`<p class="node-hint">${node.hint}</p>` : nothing}
        </section>
      `;
    case "kv":
      return html`
        <section class="node kv" data-node-index=${index}>
          ${node.label ? html`<p class="node-label">${node.label}</p>` : nothing}
          <dl class="kv-list">
            ${normalizeEntries(node.entries).map(
              (entry) => html`
                <div class="kv-row">
                  <dt>${entry.label}</dt>
                  <dd>${renderValue(entry.value)}</dd>
                </div>
              `,
            )}
          </dl>
        </section>
      `;
    case "list": {
      const tag = node.ordered ? "ol" : "ul";
      return html`
        <section class="node list" data-node-index=${index}>
          ${node.label ? html`<p class="node-label">${node.label}</p>` : nothing}
          ${tag === "ol"
            ? html`<ol class="node-list">
                ${node.items.map((item) => html`<li>${renderValue(item)}</li>`)}
              </ol>`
            : html`<ul class="node-list">
                ${node.items.map((item) => html`<li>${renderValue(item)}</li>`)}
              </ul>`}
        </section>
      `;
    }
    case "table":
      return html`
        <section class="node table" data-node-index=${index}>
          ${node.label ? html`<p class="node-label">${node.label}</p>` : nothing}
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  ${node.columns.map((column) => html`<th>${column}</th>`)}
                </tr>
              </thead>
              <tbody>
                ${node.rows.map((row) => {
                  const values = Array.isArray(row)
                    ? row
                    : node.columns.map((column) => row[column]);
                  return html`
                    <tr>
                      ${values.map((value) => html`<td>${renderCellValue(value)}</td>`)}
                    </tr>
                  `;
                })}
              </tbody>
            </table>
          </div>
        </section>
      `;
    case "badge":
      return html`
        <section class="node badge-row" data-node-index=${index}>
          <span class="badge ${toneClass(node.tone)}">${node.label}</span>
        </section>
      `;
    case "notice":
      return html`
        <section class="node notice ${toneClass(node.tone)}" data-node-index=${index}>
          ${node.title ? html`<p class="node-label">${node.title}</p>` : nothing}
          <p class="node-text">${renderValue(node.body)}</p>
        </section>
      `;
    case "json":
      return html`
        <section class="node json" data-node-index=${index}>
          ${node.label ? html`<p class="node-label">${node.label}</p>` : nothing}
          <pre>${JSON.stringify(node.value, null, 2)}</pre>
        </section>
      `;
  }
};

export const renderPresentationSummary = (
  summary: PresentationSummary | null | undefined,
  fallbackTitle?: string,
): TemplateResult | typeof nothing => {
  if (!summary && !fallbackTitle) {
    return nothing;
  }

  const title = toText(summary?.title, fallbackTitle ?? "");
  const description = toText(summary?.description);
  const value = summary?.value;
  const badge = toText(summary?.badge);

  return html`
    <section class="summary ${toneClass(summary?.tone)}">
      <div class="summary-copy">
        ${title ? html`<p class="summary-title">${title}</p>` : nothing}
        ${description ? html`<p class="summary-description">${description}</p>` : nothing}
      </div>
      <div class="summary-meta">
        ${value !== undefined && value !== null && renderValue(value).length > 0
          ? html`<strong class="summary-value">${renderValue(value)}</strong>`
          : nothing}
        ${badge ? html`<span class="badge ${toneClass(summary?.tone)}">${badge}</span>` : nothing}
      </div>
    </section>
  `;
};

export const renderPresentationNodes = (
  nodes: PresentationNode[],
): TemplateResult | typeof nothing => {
  if (nodes.length === 0) {
    return nothing;
  }

  return html`<div class="presentation">
    ${nodes.map((node, index) => renderNode(node, index))}
  </div>`;
};
