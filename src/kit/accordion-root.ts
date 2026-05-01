// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import "@/primitives/register";

import { css, html, LitElement, nothing, type TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { primitiveStaticText, type PrimitiveText } from "@/primitives/constants";
import type { PrimitiveRegistry } from "@/primitives/types";
import { kitTagNames } from "./constants";
import type { FormViewController, FormViewSnapshot, ResolvedFormLayoutNode } from "./types";

@customElement(kitTagNames.accordion)
export class KitAccordionElement extends LitElement {
  static styles = css`
    :host {
      display: block;
      inline-size: 100%;
      block-size: 100%;
      color: var(--mlf-shell-color, var(--mlf-color-text, #0f172a));
      background: var(--mlf-shell-bg, var(--mlf-color-bg, #f5f7fa));
      font-family: var(--mlf-font-family-body);
    }

    *,
    *::before,
    *::after {
      box-sizing: border-box;
    }

    .root {
      display: grid;
      grid-template-rows: auto 1fr auto;
      min-height: 100%;
      border-radius: var(--mlf-panel-radius, 12px);
      border: var(--mlf-border-width, 1px) solid
        var(--mlf-panel-border, var(--mlf-color-border, #e2e8f0));
      background: var(--mlf-panel-bg, var(--mlf-color-surface, #ffffff));
      box-shadow:
        0 2px 4px var(--mlf-panel-shadow-soft, rgba(0, 0, 0, 0.04)),
        0 8px 16px var(--mlf-panel-shadow, rgba(0, 0, 0, 0.04));
      overflow: hidden;
    }

    .header,
    .footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      padding: 0.85rem 1rem;
      background: var(--mlf-panel-header-bg, rgba(255, 255, 255, 0.6));
      border-bottom: var(--mlf-border-width, 1px) solid
        var(--mlf-panel-border, var(--mlf-color-border, #e2e8f0));
    }

    .footer {
      border-bottom: none;
      border-top: var(--mlf-border-width, 1px) solid
        var(--mlf-panel-border, var(--mlf-color-border, #e2e8f0));
      background: var(--mlf-panel-footer-bg, var(--mlf-color-bg-light, #f5f7fa));
    }

    .title {
      margin: 0;
      font-size: 1rem;
      font-weight: 700;
    }

    .actions {
      display: inline-flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .body {
      display: grid;
      gap: 0;
      overflow-y: auto;
      overflow-x: hidden;
    }

    .section + .section {
      border-top: var(--mlf-border-width, 1px) solid
        var(--mlf-panel-border, var(--mlf-color-border, #e2e8f0));
    }

    .section-toggle {
      inline-size: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      padding: 1rem;
      border: none;
      background: transparent;
      color: inherit;
      font: inherit;
      text-align: left;
      cursor: pointer;
    }

    .section-copy {
      display: grid;
      gap: 0.35rem;
    }

    .section-title {
      margin: 0;
      font-size: 0.96rem;
      font-weight: 700;
    }

    .section-description {
      margin: 0;
      font-size: var(--mlf-font-size-sm, 0.84rem);
      color: var(--mlf-color-text-muted, #475569);
      line-height: 1.5;
    }

    .chevron {
      font-size: 1.1rem;
      color: var(--mlf-color-text-muted, #475569);
    }

    .section-panel {
      display: grid;
      gap: 1rem;
      padding: 0 1rem 1rem;
    }

    .collection,
    .section-children {
      display: grid;
      gap: var(--mlf-section-gap, 1rem);
    }

    .nested-section {
      display: grid;
      gap: 0.9rem;
    }

    .nested-copy {
      display: grid;
      gap: 0.35rem;
      padding: 0 0.5rem;
    }

    .nested-title {
      margin: 0;
      font-size: 0.95rem;
      font-weight: 700;
    }

    .nested-description {
      margin: 0;
      font-size: var(--mlf-font-size-sm, 0.84rem);
      color: var(--mlf-color-text-muted, #475569);
      line-height: 1.5;
    }

    .group {
      display: grid;
      gap: 1rem;
    }

    .group.columns-2 {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .group.columns-3 {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 2.5rem;
      padding: 0.5rem 1rem;
      border-radius: var(--mlf-input-radius, 12px);
      border: var(--mlf-border-width, 1px) solid var(--mlf-input-border, #e2e8f0);
      background: #fff;
      color: var(--mlf-color-text, #0f172a);
      font: inherit;
      font-size: 0.92rem;
      font-weight: 600;
      cursor: pointer;
    }

    .btn-submit {
      border-color: var(--mlf-submit-bg, var(--mlf-color-accent, #1e40af));
      background: var(--mlf-submit-bg, var(--mlf-color-accent, #1e40af));
      color: var(--mlf-submit-color, #ffffff);
    }

    .btn:disabled {
      cursor: not-allowed;
      opacity: 0.55;
    }

    @media (max-width: 900px) {
      .group.columns-2,
      .group.columns-3 {
        grid-template-columns: minmax(0, 1fr);
      }

      .header,
      .footer {
        flex-direction: column;
        align-items: stretch;
      }
    }
  `;

  @property({ attribute: false }) accessor view: FormViewController | undefined;
  @property({ attribute: false }) accessor registry: PrimitiveRegistry | undefined;
  @property({ attribute: false }) accessor primitiveText: PrimitiveText = primitiveStaticText;
  @property({ type: String }) accessor submitLabel = "Submit";
  @property({ type: String }) accessor validatingLabel = "Validating...";
  @property({ type: String }) accessor submittingLabel = "Submitting...";

  @state() private accessor snapshot: FormViewSnapshot | null = null;

  #unsubscribe: (() => void) | null = null;

  protected willUpdate(changed: Map<string, unknown>): void {
    if (changed.has("view")) {
      this.#unsubscribe?.();
      this.#unsubscribe = null;
      this.snapshot = this.view?.getSnapshot() ?? null;
      if (this.view) {
        this.#unsubscribe = this.view.subscribe((snapshot) => {
          this.snapshot = snapshot;
        });
      }
    }
  }

  disconnectedCallback(): void {
    this.#unsubscribe?.();
    this.#unsubscribe = null;
    super.disconnectedCallback();
  }

  render() {
    const snapshot = this.snapshot;
    const accordion = snapshot?.accordion;

    if (!snapshot || !accordion || snapshot.layout.kind !== "accordion") {
      return html``;
    }

    const status = snapshot.form.status;
    const submitText =
      status === "validating"
        ? this.validatingLabel
        : status === "submitting"
          ? this.submittingLabel
          : this.submitLabel;

    return html`
      <section class="root" part="accordion-panel">
        <header class="header">
          <h1 class="title">Accordion Form</h1>
          <div class="actions">
            <button type="button" class="btn" @click=${this.#handleOpenAll}>Open all</button>
            <button type="button" class="btn" @click=${this.#handleCloseAll}>Close all</button>
          </div>
        </header>

        <div class="body">
          ${repeat(
            snapshot.layout.sections,
            (section) => section.id,
            (section) => {
              const open = accordion.openSectionIds.includes(section.id);
              return html`
                <section class="section">
                  <button
                    type="button"
                    class="section-toggle"
                    aria-expanded=${String(open)}
                    @click=${() => this.view?.toggleSection(section.id)}
                  >
                    <span class="section-copy">
                      <span class="section-title">${section.title}</span>
                      ${section.description
                        ? html`<span class="section-description">${section.description}</span>`
                        : nothing}
                    </span>
                    <span class="chevron">${open ? "−" : "+"}</span>
                  </button>
                  ${open
                    ? html`
                        <div class="section-panel">
                          <div class="collection">
                            ${repeat(
                              section.children,
                              (_, index) => `${section.id}-${index}`,
                              (node) => this.#renderNode(node, snapshot),
                            )}
                          </div>
                        </div>
                      `
                    : nothing}
                </section>
              `;
            },
          )}
        </div>

        <footer class="footer" part="actions">
          <span>${accordion.openSectionIds.length} / ${accordion.sectionCount} open</span>
          <button
            type="button"
            class="btn btn-submit"
            ?disabled=${status === "validating" || status === "submitting"}
            @click=${this.#handleSubmit}
          >
            ${submitText}
          </button>
        </footer>
      </section>
    `;
  }

  #renderNode(
    node: ResolvedFormLayoutNode,
    snapshot: FormViewSnapshot,
  ): TemplateResult | typeof nothing {
    switch (node.kind) {
      case "section":
        return html`
          <section class="nested-section" data-section-id=${node.id}>
            ${node.title || node.description
              ? html`
                  <div class="nested-copy">
                    ${node.title ? html`<h2 class="nested-title">${node.title}</h2>` : nothing}
                    ${node.description
                      ? html`<p class="nested-description">${node.description}</p>`
                      : nothing}
                  </div>
                `
              : nothing}
            <div class="section-children">
              ${repeat(
                node.children,
                (_, index) => `${node.id}-${index}`,
                (child) => this.#renderNode(child, snapshot),
              )}
            </div>
          </section>
        `;
      case "group":
        return html`
          <div class=${`group${node.columns ? ` columns-${node.columns}` : ""}`}>
            ${repeat(
              node.children,
              (_, index) => `${node.id}-${index}`,
              (child) => this.#renderNode(child, snapshot),
            )}
          </div>
        `;
      case "field": {
        const field = snapshot.fields.find((entry) => entry.id === node.field);
        if (!field) {
          return nothing;
        }

        return html`
          <mlf-field-frame
            .controller=${field.controller}
            .registry=${this.registry}
            .text=${this.primitiveText}
          ></mlf-field-frame>
        `;
      }
      case "report": {
        const report = snapshot.reports.find((entry) => entry.id === node.report);
        if (!report) {
          return nothing;
        }

        return html`
          <mlf-report-frame
            .controller=${report.controller}
            .registry=${this.registry}
            .text=${this.primitiveText}
            .lastResult=${snapshot.form.lastResult}
          ></mlf-report-frame>
        `;
      }
      case "explanation": {
        const explanation = snapshot.explanations.find((entry) => entry.id === node.explanation);
        if (!explanation) {
          return nothing;
        }

        return html`
          <mlf-explanation-panel
            .controller=${explanation.controller}
            .registry=${this.registry}
            .text=${this.primitiveText}
            .lastResult=${snapshot.form.lastResult}
          ></mlf-explanation-panel>
        `;
      }
    }
  }

  #handleOpenAll = (): void => {
    this.view?.openAllSections();
  };

  #handleCloseAll = (): void => {
    this.view?.closeAllSections();
  };

  #handleSubmit = async (): Promise<void> => {
    await this.view?.submit();
  };
}

declare global {
  interface HTMLElementTagNameMap {
    [kitTagNames.accordion]: KitAccordionElement;
  }
}
