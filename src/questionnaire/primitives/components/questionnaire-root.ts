// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { css, html, LitElement, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { SubmissionAbortedError, type FormController, type FormStatus } from "@/engine";
import { ControllerBinding } from "@/primitives/controller-binding";
import { primitiveStaticText, type PrimitiveText } from "@/primitives/constants";
import type { PrimitiveRegistry } from "@/primitives/types";
import {
  questionnaireEventNames,
  questionnaireStaticText,
  questionnaireTagNames,
  type QuestionnaireText,
} from "../../constants";
import type { IQuestionnaireController, QuestionnaireState } from "../../types";

@customElement(questionnaireTagNames.questionnaire)
export class QuestionnaireRootElement extends LitElement {
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

    /* Fixed header — never scrolls */
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

    /* Scrollable middle — grows to fill available space */
    .pane-body {
      flex: 1 1 auto;
      display: grid;
      align-content: start;
      gap: 1rem;
      padding: 1rem 1rem 1.25rem;
      overflow-y: auto;
      overflow-x: hidden;
      overscroll-behavior: contain;
      scrollbar-color: color-mix(in srgb, var(--mlf-color-text-muted, #475569) 55%, transparent)
        transparent;
    }

    .pane-body::-webkit-scrollbar {
      width: 8px;
    }

    .pane-body::-webkit-scrollbar-thumb {
      background: color-mix(in srgb, var(--mlf-color-text-muted, #475569) 50%, transparent);
      border-radius: 999px;
    }

    .collection {
      display: grid;
      gap: var(--mlf-section-gap, 1rem);
    }

    /* Fixed footer — never scrolls */
    .actions {
      flex: 0 0 var(--mlf-q-footer-height, 4.5rem);
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

    .btn-prev:hover:not(:disabled) {
      background: color-mix(in srgb, var(--mlf-color-text-muted, #475569) 8%, transparent);
    }

    .btn-next,
    .btn-submit {
      background: var(--mlf-submit-bg, var(--mlf-color-accent, #1e40af));
      border-color: var(--mlf-submit-bg, var(--mlf-color-accent, #1e40af));
      color: var(--mlf-submit-color, #ffffff);
    }

    .btn-next:hover:not(:disabled),
    .btn-submit:hover:not(:disabled) {
      opacity: 0.88;
    }

    .btn-next:focus-visible,
    .btn-submit:focus-visible,
    .btn-prev:focus-visible {
      outline: none;
      box-shadow: 0 0 0 3px var(--mlf-input-shadow-focus, rgba(29, 78, 216, 0.18));
    }

    .spacer {
      flex: 1 1 auto;
    }
  `;

  @property({ attribute: false }) accessor controller: IQuestionnaireController | undefined;
  @property({ attribute: false }) accessor registry: PrimitiveRegistry | undefined;
  @property({ attribute: false }) accessor text: QuestionnaireText = questionnaireStaticText;
  @property({ attribute: false }) accessor primitiveText: PrimitiveText = primitiveStaticText;

  @state() private accessor qState: QuestionnaireState | null = null;
  @state() private accessor formStatus: FormStatus = "idle";

  readonly #qBinding = new ControllerBinding<IQuestionnaireController>(this, (ctrl) => {
    this.qState = ctrl?.state ?? null;
    if (ctrl) {
      this.#attachFormSelector(ctrl.form);
    }
  });

  #formUnsubscribe: (() => void) | null = null;
  #connectedForm: FormController | undefined;

  protected willUpdate(changed: Map<string, unknown>): void {
    if (changed.has("controller")) {
      this.#qBinding.bind(this.controller);
    }
  }

  disconnectedCallback(): void {
    this.#formUnsubscribe?.();
    this.#formUnsubscribe = null;
    this.#connectedForm = undefined;
    super.disconnectedCallback();
  }

  render() {
    const ctrl = this.controller;
    const qState = this.qState;

    if (!ctrl || !qState) {
      return html``;
    }

    const { currentStep, stepProgress, canGoPrev, isLastStep } = qState;
    const form = ctrl.form;
    const text = this.text;
    const formStatus = this.formStatus;
    const isSubmitting = formStatus === "submitting" || formStatus === "validating";

    const visibleFields = currentStep.fieldIds
      .map((id) => form.getField(id))
      .filter((f): f is NonNullable<typeof f> => f !== undefined && f.state.visible);

    const nextLabel = isLastStep
      ? formStatus === "validating"
        ? text.validatingLabel
        : formStatus === "submitting"
          ? text.submittingLabel
          : text.submitLabel
      : text.nextLabel;

    return html`
      <div class="root">
        <section class="panel" part="questionnaire-panel">
          <header class="pane-header">
            <mlf-step-indicator
              .current=${stepProgress.current}
              .total=${stepProgress.total}
              .label=${text.stepLabel(stepProgress.current, stepProgress.total).split(" ")[0] ??
              "Step"}
            ></mlf-step-indicator>

            <h1 class="step-title">${currentStep.title}</h1>

            ${currentStep.description
              ? html`<p class="step-description">${currentStep.description}</p>`
              : nothing}
          </header>

          <div class="pane-body">
            <div class="collection" part="field-list">
              ${repeat(
                visibleFields,
                (field) => field.id,
                (field) => html`
                  <mlf-field-frame
                    .controller=${field}
                    .registry=${this.registry}
                    .text=${this.primitiveText}
                  ></mlf-field-frame>
                `,
              )}
            </div>
          </div>

          <div class="actions" part="actions">
            <button
              type="button"
              class="btn btn-prev"
              ?disabled=${!canGoPrev || isSubmitting}
              @click=${this.#handlePrev}
            >
              ${text.prevLabel}
            </button>

            <span class="spacer"></span>

            <button
              type="button"
              class=${isLastStep ? "btn btn-submit" : "btn btn-next"}
              ?disabled=${isSubmitting}
              @click=${isLastStep ? this.#handleSubmit : this.#handleNext}
            >
              ${nextLabel}
            </button>
          </div>
        </section>
      </div>
    `;
  }

  #handleNext = async (): Promise<void> => {
    const ctrl = this.controller;
    if (!ctrl) return;

    const advanced = await ctrl.next();

    if (!advanced) {
      this.dispatchEvent(
        new CustomEvent(questionnaireEventNames.stepValidationError, {
          detail: { state: ctrl.state },
          bubbles: true,
          composed: true,
        }),
      );
    } else {
      this.dispatchEvent(
        new CustomEvent(questionnaireEventNames.stepChange, {
          detail: { state: ctrl.state },
          bubbles: true,
          composed: true,
        }),
      );
    }
  };

  #handlePrev = (): void => {
    const ctrl = this.controller;
    if (!ctrl) return;

    ctrl.prev();

    this.dispatchEvent(
      new CustomEvent(questionnaireEventNames.stepChange, {
        detail: { state: ctrl.state },
        bubbles: true,
        composed: true,
      }),
    );
  };

  #handleSubmit = async (): Promise<void> => {
    const ctrl = this.controller;
    if (!ctrl) return;

    // Validate final step before submitting
    const advanced = await ctrl.next();
    if (!advanced) {
      this.dispatchEvent(
        new CustomEvent(questionnaireEventNames.stepValidationError, {
          detail: { state: ctrl.state },
          bubbles: true,
          composed: true,
        }),
      );
      return;
    }

    this.dispatchEvent(
      new CustomEvent(questionnaireEventNames.submitStart, {
        detail: { form: ctrl.form, state: ctrl.form.state },
        bubbles: true,
        composed: true,
      }),
    );

    try {
      const result = await ctrl.form.submit();

      this.dispatchEvent(
        new CustomEvent(questionnaireEventNames.submitSuccess, {
          detail: { form: ctrl.form, state: ctrl.form.state, result },
          bubbles: true,
          composed: true,
        }),
      );
    } catch (error) {
      this.dispatchEvent(
        new CustomEvent(
          error instanceof SubmissionAbortedError
            ? questionnaireEventNames.submitAbort
            : questionnaireEventNames.submitError,
          {
            detail: { form: ctrl.form, state: ctrl.form.state, error },
            bubbles: true,
            composed: true,
          },
        ),
      );
    }
  };

  #attachFormSelector(form: FormController): void {
    if (this.#connectedForm === form) {
      return;
    }

    this.#formUnsubscribe?.();
    this.#formUnsubscribe = null;
    this.#connectedForm = form;
    this.formStatus = form.state.status;

    this.#formUnsubscribe = form.subscribeSelector(
      () => form.state.status,
      (status) => {
        this.formStatus = status;
      },
    );
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [questionnaireTagNames.questionnaire]: QuestionnaireRootElement;
  }
}
