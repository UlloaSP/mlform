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

@customElement(kitTagNames.tabs)
export class KitTabsElement extends LitElement {
  static styles = css`
    :host {
      display: block;
      flex: 1 1 auto;
      align-self: stretch;
      inline-size: 100%;
      block-size: 100%;
      color: var(--mlf-shell-color, var(--mlf-color-text, #0f172a));
      background: var(--mlf-shell-bg, var(--mlf-color-bg, #f5f7fa));
      font-family: var(--mlf-font-family-body);
      min-width: 0;
      min-height: 0;
    }

    *,
    *::before,
    *::after {
      box-sizing: border-box;
    }

    .root {
      display: grid;
      grid-template-rows: auto 1fr auto;
      inline-size: 100%;
      block-size: 100%;
      min-width: 0;
      min-height: 0;
      overflow: hidden;
      border-radius: var(--mlf-panel-radius, 12px);
      border: var(--mlf-border-width, 1px) solid
        var(--mlf-panel-border, var(--mlf-color-border, #e2e8f0));
      background: var(--mlf-panel-bg, var(--mlf-color-surface, #ffffff));
      box-shadow:
        0 2px 4px var(--mlf-panel-shadow-soft, rgba(0, 0, 0, 0.04)),
        0 8px 16px var(--mlf-panel-shadow, rgba(0, 0, 0, 0.04));
    }

    .tablist {
      display: flex;
      gap: 0.35rem;
      overflow-x: auto;
      padding: 0.85rem 1rem 0;
      border-bottom: var(--mlf-border-width, 1px) solid
        var(--mlf-panel-border, var(--mlf-color-border, #e2e8f0));
      background: var(--mlf-panel-header-bg, rgba(255, 255, 255, 0.6));
      scrollbar-width: thin;
    }

    .tab {
      position: relative;
      border: none;
      border-radius: 12px 12px 0 0;
      background: transparent;
      color: var(--mlf-color-text-muted, #475569);
      font: inherit;
      font-size: 0.94rem;
      font-weight: 600;
      padding: 0.85rem 1rem 0.75rem;
      cursor: pointer;
      white-space: nowrap;
    }

    .tab[aria-selected="true"] {
      color: var(--mlf-color-text, #0f172a);
      background: color-mix(in srgb, var(--mlf-color-surface, #ffffff) 94%, transparent);
    }

    .tab[aria-selected="true"]::after {
      content: "";
      position: absolute;
      inset-inline: 0.8rem;
      inset-block-end: 0;
      block-size: 3px;
      border-radius: 999px;
      background: var(--mlf-color-accent, #1e40af);
    }

    .tab-panel {
      display: grid;
      grid-template-rows: auto 1fr;
      min-width: 0;
      min-height: 0;
      overflow: hidden;
    }

    .tab-header {
      display: grid;
      gap: 0.35rem;
      padding: 1rem 1.25rem 0.5rem;
    }

    .tab-title {
      margin: 0;
      font-size: 1.08rem;
      font-weight: 700;
      color: var(--mlf-color-text, #0f172a);
      line-height: 1.3;
    }

    .tab-description {
      margin: 0;
      font-size: var(--mlf-font-size-sm, 0.84rem);
      color: var(--mlf-color-text-muted, #475569);
      line-height: 1.5;
    }

    .body {
      display: grid;
      align-content: start;
      gap: 1rem;
      padding: 0.5rem 1rem 1.25rem;
      overflow-y: auto;
      overflow-x: hidden;
    }

    .collection,
    .section-children {
      display: grid;
      gap: var(--mlf-section-gap, 1rem);
    }

    .section {
      display: grid;
      gap: 0.9rem;
    }

    .section-copy {
      display: grid;
      gap: 0.35rem;
      padding: 0 0.5rem;
    }

    .section-title {
      margin: 0;
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--mlf-color-text, #0f172a);
    }

    .section-description {
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

    .footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      padding: 0.85rem 1rem 1rem;
      border-top: var(--mlf-border-width, 1px) solid
        var(--mlf-panel-border, var(--mlf-color-border, #e2e8f0));
      background: var(--mlf-panel-footer-bg, var(--mlf-color-bg-light, #f5f7fa));
    }

    .nav {
      display: inline-flex;
      gap: 0.5rem;
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

    .btn:disabled {
      cursor: not-allowed;
      opacity: 0.55;
    }

    .btn-submit {
      border-color: var(--mlf-submit-bg, var(--mlf-color-accent, #1e40af));
      background: var(--mlf-submit-bg, var(--mlf-color-accent, #1e40af));
      color: var(--mlf-submit-color, #ffffff);
    }

    @media (max-width: 900px) {
      .group.columns-2,
      .group.columns-3 {
        grid-template-columns: minmax(0, 1fr);
      }

      .footer {
        flex-direction: column;
        align-items: stretch;
      }

      .nav {
        justify-content: space-between;
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
    const tabsState = snapshot?.tabs;

    if (!snapshot || !tabsState || snapshot.layout.kind !== "tabs") {
      return html``;
    }

    const activeTab = snapshot.layout.tabs[tabsState.activeTabIndex];
    if (!activeTab) {
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
      <section class="root" part="tabs-panel">
        <div class="tablist" role="tablist" aria-label="Form sections">
          ${repeat(
            snapshot.layout.tabs,
            (tab) => tab.id,
            (tab, index) => html`
              <button
                type="button"
                class="tab"
                role="tab"
                aria-selected=${String(index === tabsState.activeTabIndex)}
                aria-controls=${`panel-${tab.id}`}
                id=${`tab-${tab.id}`}
                @click=${() => this.view?.setActiveTab(tab.id)}
              >
                ${tab.title}
              </button>
            `,
          )}
        </div>

        <div
          class="tab-panel"
          role="tabpanel"
          id=${`panel-${activeTab.id}`}
          aria-labelledby=${`tab-${activeTab.id}`}
        >
          ${activeTab.title || activeTab.description
            ? html`
                <header class="tab-header">
                  <h1 class="tab-title">${activeTab.title}</h1>
                  ${activeTab.description
                    ? html`<p class="tab-description">${activeTab.description}</p>`
                    : nothing}
                </header>
              `
            : nothing}

          <div class="body">
            <div class="collection">
              ${repeat(
                activeTab.children,
                (_, index) => `${activeTab.id}-${index}`,
                (node) => this.#renderNode(node, snapshot),
              )}
            </div>
          </div>
        </div>

        <footer class="footer" part="actions">
          <div class="nav">
            <button
              type="button"
              class="btn"
              ?disabled=${!tabsState.canGoPrev}
              @click=${() => this.view?.prevTab()}
            >
              Previous
            </button>
            <button
              type="button"
              class="btn"
              ?disabled=${!tabsState.canGoNext}
              @click=${() => this.view?.nextTab()}
            >
              Next
            </button>
          </div>
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
          <section class="section" data-section-id=${node.id}>
            ${node.title || node.description
              ? html`
                  <div class="section-copy">
                    ${node.title ? html`<h2 class="section-title">${node.title}</h2>` : nothing}
                    ${node.description
                      ? html`<p class="section-description">${node.description}</p>`
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
          <div
            class=${`group${node.columns ? ` columns-${node.columns}` : ""}`}
            data-group-id=${node.id}
          >
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

  #handleSubmit = async (): Promise<void> => {
    await this.view?.submit();
  };
}

declare global {
  interface HTMLElementTagNameMap {
    [kitTagNames.tabs]: KitTabsElement;
  }
}
