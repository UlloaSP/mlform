// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import "@/primitives";
import "./step-indicator";

import { html, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import {
  focusPrimitiveField,
  primitiveStaticText,
  type PrimitiveRegistry,
  type PrimitiveReportTransport,
  type PrimitiveText,
} from "@/primitives";
import { kitTagNames } from "../constants";
import { indexLayoutItems, renderLayoutNode } from "../shared/layout-node-render";
import { revealFirstInvalidField } from "../shared/error-navigation";
import { KitViewElement } from "../shared/view-element";
import type { ReportFetchMode } from "@/view";
import { defaultWizardLabels, resolveWizardText } from "./labels";
import { wizardRootStyles } from "./styles";

@customElement(kitTagNames.wizard)
export class KitWizardElement extends KitViewElement {
  static styles = wizardRootStyles;

  @property({ attribute: false }) accessor registry: PrimitiveRegistry | undefined;
  @property({ attribute: false }) accessor primitiveText: PrimitiveText = primitiveStaticText;
  @property({ attribute: false }) accessor reportTransport: PrimitiveReportTransport | undefined;
  @property({ attribute: false }) accessor reportFetchMode: ReportFetchMode = "lazy";
  @property({ attribute: false }) accessor labels = defaultWizardLabels;
  @property({ attribute: false }) accessor text = resolveWizardText();

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

    const operation = snapshot.form.operation;
    const suspended = snapshot.form.lifecycle === "suspended";
    const busy = suspended || operation === "validating" || operation === "submitting";
    const actionLabel = wizard.isLastStep
      ? operation === "validating"
        ? this.labels.validating
        : operation === "submitting"
          ? this.labels.submitting
          : this.labels.submit
      : this.labels.next;
    const itemIndex = indexLayoutItems(snapshot, this.reportPane);

    return html`
      <div
        class="root"
        data-lifecycle=${snapshot.form.lifecycle}
        ?inert=${suspended}
        aria-disabled=${String(suspended)}
      >
        <section class="panel" part="wizard-panel">
          <header class="pane-header">
            <mlf-kit-step-indicator
              .current=${wizard.stepIndex + 1}
              .total=${wizard.stepCount}
              .label=${this.labels.step}
              .description=${this.text.stepLabel(wizard.stepIndex + 1, wizard.stepCount)}
            ></mlf-kit-step-indicator>
            <h1 class="step-title">${step.title}</h1>
            ${
              step.description ? html`<p class="step-description">${step.description}</p>` : nothing
            }
          </header>

          <div class="pane-body">
            <mlf-form-errors .form=${this.view?.form} .text=${this.primitiveText}></mlf-form-errors>
            <div class="collection">
              ${repeat(
                step.children,
                (_, index) => `${step.id}-${index}`,
                (node) =>
                  renderLayoutNode({
                    node,
                    view: this.view,
                    snapshot,
                    itemIndex,
                    registry: this.registry,
                    primitiveText: this.primitiveText,
                    reportTransport: this.reportTransport,
                    reportFetchMode: this.reportFetchMode,
                    sectionClass: "section",
                    sectionCopyClass: "section-copy",
                    sectionTitleClass: "section-title",
                    sectionDescriptionClass: "section-description",
                    childrenClass: "section-children",
                    groupBaseClass: "group",
                  }),
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

  #handlePrev = (): void => {
    this.view?.navigation.previous();
  };

  #handleNext = async (): Promise<void> => {
    const advanced = await this.view?.navigation.next();
    if (advanced === false && this.view) {
      await revealFirstInvalidField(this, this.view, focusPrimitiveField);
    }
  };

  #handleSubmit = async (): Promise<void> => {
    if (!this.view) {
      return;
    }

    const valid = await this.view.navigation.next();
    if (!valid) {
      await revealFirstInvalidField(this, this.view, focusPrimitiveField);
      return;
    }

    try {
      await this.view.submit();
    } catch {
      await revealFirstInvalidField(this, this.view, focusPrimitiveField);
    }
  };
}

declare global {
  interface HTMLElementTagNameMap {
    [kitTagNames.wizard]: KitWizardElement;
  }
}
