// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import "@/primitives/register";
import "./step-indicator";

import { html, LitElement, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { primitiveStaticText, type PrimitiveText } from "@/primitives/constants";
import type { PrimitiveRegistry } from "@/primitives/types";
import { kitTagNames } from "./constants";
import { renderLayoutNode } from "./layout-node-render";
import { revealFirstInvalidField } from "./error-navigation";
import type { FormViewController, FormViewSnapshot } from "./types";
import { defaultWizardLabels, resolveWizardText } from "./wizard-constants";
import { wizardRootStyles } from "./wizard-root-styles";

@customElement(kitTagNames.wizard)
export class KitWizardElement extends LitElement {
  static styles = wizardRootStyles;

  @property({ attribute: false }) accessor view: FormViewController | undefined;
  @property({ attribute: false }) accessor registry: PrimitiveRegistry | undefined;
  @property({ attribute: false }) accessor primitiveText: PrimitiveText = primitiveStaticText;
  @property({ attribute: false }) accessor labels = defaultWizardLabels;
  @property({ attribute: false }) accessor text = resolveWizardText();

  @state() private accessor snapshot: FormViewSnapshot | null = null;

  #unsubscribe: (() => void) | null = null;

  protected willUpdate(changed: Map<string, unknown>): void {
    if (!changed.has("view")) {
      return;
    }

    this.#unsubscribe?.();
    this.#unsubscribe = null;
    this.snapshot = this.view?.getSnapshot() ?? null;
    if (this.view) {
      this.#unsubscribe = this.view.subscribe((snapshot) => {
        this.snapshot = snapshot;
      });
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
                (node) =>
                  renderLayoutNode({
                    node,
                    snapshot,
                    registry: this.registry,
                    primitiveText: this.primitiveText,
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
    this.view?.prevStep();
  };

  #handleNext = async (): Promise<void> => {
    const advanced = await this.view?.nextStep();
    if (advanced === false && this.view) {
      await revealFirstInvalidField(this, this.view);
    }
  };

  #handleSubmit = async (): Promise<void> => {
    if (!this.view) {
      return;
    }

    const valid = await this.view.nextStep();
    if (!valid) {
      await revealFirstInvalidField(this, this.view);
      return;
    }

    try {
      await this.view.submit();
    } catch (error) {
      const handled = await revealFirstInvalidField(this, this.view);
      if (!handled) {
        throw error;
      }
    }
  };
}

declare global {
  interface HTMLElementTagNameMap {
    [kitTagNames.wizard]: KitWizardElement;
  }
}
