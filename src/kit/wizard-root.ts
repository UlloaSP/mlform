// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import "@/primitives/register";
import "./step-indicator";

import { css, html, LitElement, nothing, type TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { primitiveStaticText, type PrimitiveText } from "@/primitives/constants";
import type { PrimitiveRegistry } from "@/primitives/types";
import { kitTagNames } from "./constants";
import type { FormViewController, FormViewSnapshot, ResolvedFormLayoutNode } from "./types";
import { defaultWizardLabels, resolveWizardText } from "./wizard-constants";

@customElement(kitTagNames.wizard)
export class KitWizardElement extends LitElement {
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
      grid-template-rows: 1fr;
      gap: var(--mlf-shell-gap, 1rem);
      inline-size: 100%;
      block-size: 100%;
      min-width: 0;
      min-height: 0;
    }

    .panel {
      display: flex;
      flex-direction: column;
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

    .pane-header {
      flex: 0 0 auto;
      display: grid;
      gap: 0.85rem;
      padding: 1rem 1.5rem;
      border-bottom: var(--mlf-border-width, 1px) solid
        var(--mlf-panel-border, var(--mlf-color-border, #e2e8f0));
      background: var(--mlf-panel-header-bg, rgba(255, 255, 255, 0.6));
      backdrop-filter: blur(var(--mlf-header-blur, 3px));
      -webkit-backdrop-filter: blur(var(--mlf-header-blur, 3px));
    }

    .step-title {
      margin: 0;
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--mlf-pane-title-color, var(--mlf-color-text, #0f172a));
      line-height: 1.3;
    }

    .step-description {
      margin: 0;
      font-size: var(--mlf-font-size-sm, 0.84rem);
      color: var(--mlf-color-text-muted, #475569);
      line-height: 1.5;
    }

    .pane-body {
      flex: 1 1 auto;
      display: grid;
      align-content: start;
      gap: 1rem;
      padding: 1rem 1rem 1.25rem;
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

    .actions {
      flex: 0 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.75rem 1.5rem;
      border-top: var(--mlf-border-width, 1px) solid
        var(--mlf-panel-border, var(--mlf-color-border, #e2e8f0));
      background: var(--mlf-panel-footer-bg, var(--mlf-color-bg-light, #f5f7fa));
    }

    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      min-height: 2.5rem;
      padding: 0.5rem 1.25rem;
      border: var(--mlf-border-width, 1px) solid transparent;
      border-radius: var(--mlf-input-radius, 12px);
      font: inherit;
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
      transition:
        background-color 0.2s ease,
        border-color 0.2s ease,
        opacity 0.2s ease;
    }

    .btn:disabled {
      cursor: not-allowed;
      opacity: 0.55;
    }

    .btn-prev {
      background: transparent;
      border-color: var(--mlf-input-border, var(--mlf-color-border, #e2e8f0));
      color: var(--mlf-color-text-muted, #475569);
    }

    .btn-next,
    .btn-submit {
      background: var(--mlf-submit-bg, var(--mlf-color-accent, #1e40af));
      border-color: var(--mlf-submit-bg, var(--mlf-color-accent, #1e40af));
      color: var(--mlf-submit-color, #ffffff);
    }

    .spacer {
      flex: 1 1 auto;
    }

    @media (max-width: 900px) {
      .group.columns-2,
      .group.columns-3 {
        grid-template-columns: minmax(0, 1fr);
      }
    }
  `;

  @property({ attribute: false }) accessor view: FormViewController | undefined;
  @property({ attribute: false }) accessor registry: PrimitiveRegistry | undefined;
  @property({ attribute: false }) accessor primitiveText: PrimitiveText = primitiveStaticText;
  @property({ attribute: false }) accessor labels = defaultWizardLabels;
  @property({ attribute: false }) accessor text = resolveWizardText();

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
    const wizard = snapshot?.wizard;

    if (!snapshot || !wizard || snapshot.layout.kind !== "wizard") {
      return html``;
    }

    const step = snapshot.layout.steps[wizard.stepIndex];
    if (!step) {
      return html``;
    }

    const status = snapshot.form.status;
    const busy = status === "validating" || status === "submitting";
    const actionLabel = wizard.isLastStep
      ? status === "validating"
        ? this.labels.validating
        : status === "submitting"
          ? this.labels.submitting
          : this.labels.submit
      : this.labels.next;

    return html`
      <div class="root">
        <section class="panel" part="wizard-panel">
          <header class="pane-header">
            <mlf-kit-step-indicator
              .current=${wizard.stepIndex + 1}
              .total=${wizard.stepCount}
              .label=${this.text.stepLabel(wizard.stepIndex + 1, wizard.stepCount).split(" ")[0] ??
              "Step"}
            ></mlf-kit-step-indicator>
            <h1 class="step-title">${step.title}</h1>
            ${step.description
              ? html`<p class="step-description">${step.description}</p>`
              : nothing}
          </header>

          <div class="pane-body">
            <div class="collection">
              ${repeat(
                step.children,
                (_, index) => `${step.id}-${index}`,
                (node) => this.#renderNode(node, snapshot),
              )}
            </div>
          </div>

          <div class="actions" part="actions">
            <button
              type="button"
              class="btn btn-prev"
              ?disabled=${!wizard.canPrev || busy}
              @click=${this.#handlePrev}
            >
              ${this.labels.prev}
            </button>
            <span class="spacer"></span>
            <button
              type="button"
              class=${wizard.isLastStep ? "btn btn-submit" : "btn btn-next"}
              ?disabled=${busy}
              @click=${wizard.isLastStep ? this.#handleSubmit : this.#handleNext}
            >
              ${actionLabel}
            </button>
          </div>
        </section>
      </div>
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

  #handlePrev = (): void => {
    this.view?.prevStep();
  };

  #handleNext = async (): Promise<void> => {
    await this.view?.nextStep();
  };

  #handleSubmit = async (): Promise<void> => {
    if (!this.view) {
      return;
    }

    const valid = await this.view.nextStep();
    if (!valid) {
      return;
    }

    await this.view.submit();
  };
}

declare global {
  interface HTMLElementTagNameMap {
    [kitTagNames.wizard]: KitWizardElement;
  }
}
