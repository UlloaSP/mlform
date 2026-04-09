// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { css, html, LitElement } from "lit";
import { property, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { SubmissionAbortedError, type FormController, type FormState } from "@/engine";
import {
  primitiveDefaultLabels,
  primitiveEventNames,
  primitiveStaticText,
  primitiveTagNames,
} from "../constants";
import type { PrimitiveLayout, PrimitiveRegistry } from "../types";

export class PrimitiveFormElement extends LitElement {
  static styles = css`
    :host {
      display: block;
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
      gap: var(--mlf-shell-gap, 1rem);
    }

    .root.split {
      grid-template-columns: minmax(0, 1.15fr) minmax(var(--mlf-pane-min-width, 22rem), 0.85fr);
      align-items: start;
    }

    .panel {
      display: grid;
      gap: 0;
      min-width: 0;
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
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      padding: 0.85rem 1.5rem;
      border-bottom: var(--mlf-border-width, 1px) solid
        var(--mlf-panel-border, var(--mlf-color-border, #e2e8f0));
      background: var(--mlf-panel-header-bg, rgba(255, 255, 255, 0.6));
      backdrop-filter: blur(var(--mlf-header-blur, 3px));
      -webkit-backdrop-filter: blur(var(--mlf-header-blur, 3px));
    }

    .pane-copy {
      display: grid;
      gap: 0.28rem;
    }

    .eyebrow {
      margin: 0;
      font-size: 0.8rem;
      font-weight: 600;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--mlf-pane-eyebrow-color, var(--mlf-color-text-muted, #475569));
    }

    .pane-title {
      margin: 0;
      color: var(--mlf-pane-title-color, var(--mlf-color-text, #0f172a));
      font-size: 1rem;
      font-weight: 600;
    }

    .status {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 2rem;
      padding: 0.35rem 0.75rem;
      border-radius: 999px;
      background: var(
        --mlf-status-bg,
        color-mix(in srgb, var(--mlf-color-accent, #1e40af) 10%, transparent)
      );
      color: var(--mlf-status-color, var(--mlf-color-secondary, #475569));
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      white-space: nowrap;
    }

    .pane-body {
      display: grid;
      gap: 1rem;
      padding: 1rem 1rem 0;
    }

    .meta {
      display: flex;
      flex-wrap: wrap;
      gap: 0.6rem 1rem;
      color: var(--mlf-color-text-muted, #475569);
      font-size: 0.84rem;
    }

    .collection {
      display: grid;
      gap: var(--mlf-section-gap, 1rem);
    }

    .actions {
      padding: 1rem 1.5rem 1.25rem;
      border-top: var(--mlf-border-width, 1px) solid
        var(--mlf-panel-border, var(--mlf-color-border, #e2e8f0));
      background: var(--mlf-panel-footer-bg, var(--mlf-color-bg-light, #f5f7fa));
    }

    @media (max-width: 900px) {
      .root.split {
        grid-template-columns: 1fr;
      }
    }
  `;

  @property({ attribute: false }) accessor form: FormController | undefined;
  @property({ attribute: false }) accessor registry: PrimitiveRegistry | undefined;
  @property({ type: String }) accessor layout: PrimitiveLayout = "stacked";
  @property({ type: String, attribute: "form-label" }) accessor formLabel =
    primitiveDefaultLabels.form;
  @property({ type: String, attribute: "reports-label" }) accessor reportsLabel =
    primitiveDefaultLabels.reports;
  @property({ type: String, attribute: "submit-label" }) accessor submitLabel =
    primitiveDefaultLabels.submit;
  @property({ type: String, attribute: "validating-label" }) accessor validatingLabel =
    primitiveDefaultLabels.validating;
  @property({ type: String, attribute: "submitting-label" }) accessor submittingLabel =
    primitiveDefaultLabels.submitting;
  @property({ type: String, attribute: "report-pane" }) accessor reportPane:
    | "auto"
    | "always"
    | "hidden" = "auto";

  @state() private accessor formState: FormState | null = null;

  #unsubscribe: (() => void) | null = null;
  #connectedForm: FormController | undefined;

  protected willUpdate(changedProperties: Map<string, unknown>): void {
    if (changedProperties.has("form")) {
      this.#attachForm();
    }
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.#attachForm();
  }

  disconnectedCallback(): void {
    this.#unsubscribe?.();
    this.#unsubscribe = null;
    this.#connectedForm = undefined;
    super.disconnectedCallback();
  }

  render() {
    const form = this.form;
    const state = this.formState;

    if (!form || !state) {
      return html``;
    }

    const visibleFields = form.fields.filter((field) => field.state.visible);
    const visibleReports = form.reports.filter(
      (report) => report.descriptor !== null || report.state.status !== "idle",
    );
    const reportsToRender = this.reportPane === "always" ? form.reports : visibleReports;
    const showReports =
      this.reportPane === "always"
        ? form.reports.length > 0
        : this.reportPane === "auto"
          ? reportsToRender.length > 0
          : false;

    return html`
      <div class="root ${this.layout}">
        <section class="panel form-pane" part="form-pane">
          <header class="pane-header">
            <div class="pane-copy">
              <p class="eyebrow">${primitiveStaticText.formEyebrow}</p>
              <h1 class="pane-title">${this.formLabel}</h1>
            </div>
            <span class="status">${state.status}</span>
          </header>

          <div class="pane-body">
            <div class="meta">
              <span>${visibleFields.length} fields</span>
              <span>${form.reports.length} reports</span>
              <span>${state.submitCount} submits</span>
            </div>

            <mlf-form-errors .form=${form}></mlf-form-errors>

            <div class="collection" part="field-list">
              ${repeat(
                visibleFields,
                (field) => field.id,
                (field) => html`
                  <mlf-field-frame
                    .controller=${field}
                    .registry=${this.registry}
                  ></mlf-field-frame>
                `,
              )}
            </div>
          </div>

          <div class="actions" part="actions">
            <mlf-submit-button
              .status=${state.status}
              .idleLabel=${this.submitLabel}
              .validatingLabel=${this.validatingLabel}
              .submittingLabel=${this.submittingLabel}
              @mlf-submit-request=${this.#handleSubmitRequest}
            ></mlf-submit-button>
          </div>
        </section>

        ${showReports
          ? html`
              <aside class="panel report-pane" part="report-pane">
                <header class="pane-header">
                  <div class="pane-copy">
                    <p class="eyebrow">${primitiveStaticText.reportEyebrow}</p>
                    <h2 class="pane-title">${this.reportsLabel}</h2>
                  </div>
                  <span class="status">${reportsToRender.length}</span>
                </header>

                <div class="pane-body">
                  <div class="collection" part="report-list">
                    ${repeat(
                      reportsToRender,
                      (report) => report.id,
                      (report) => html`
                        <mlf-report-frame
                          .controller=${report}
                          .registry=${this.registry}
                        ></mlf-report-frame>
                      `,
                    )}
                  </div>
                </div>
              </aside>
            `
          : html``}
      </div>
    `;
  }

  #handleSubmitRequest = async (): Promise<void> => {
    if (!this.form) {
      return;
    }

    this.dispatchEvent(
      new CustomEvent(primitiveEventNames.submitStart, {
        detail: {
          form: this.form,
          state: this.form.state,
        },
        bubbles: true,
        composed: true,
      }),
    );

    try {
      const result = await this.form.submit();

      this.dispatchEvent(
        new CustomEvent(primitiveEventNames.submitSuccess, {
          detail: {
            form: this.form,
            state: this.form.state,
            result,
          },
          bubbles: true,
          composed: true,
        }),
      );
    } catch (error) {
      this.dispatchEvent(
        new CustomEvent(
          error instanceof SubmissionAbortedError
            ? primitiveEventNames.submitAbort
            : primitiveEventNames.submitError,
          {
            detail: {
              form: this.form,
              state: this.form.state,
              status: this.form.state.status,
              error,
            },
            bubbles: true,
            composed: true,
          },
        ),
      );
    }
  };

  #attachForm(): void {
    if (!this.isConnected) {
      return;
    }

    if (this.#connectedForm === this.form) {
      this.formState = this.form?.state ?? null;
      return;
    }

    this.#unsubscribe?.();
    this.#unsubscribe = null;
    this.#connectedForm = this.form;
    this.formState = this.form?.state ?? null;

    if (!this.form) {
      return;
    }

    this.#unsubscribe = this.form.subscribe((nextState) => {
      this.formState = nextState;
    });
  }
}

customElements.define(primitiveTagNames.form, PrimitiveFormElement);

declare global {
  interface HTMLElementTagNameMap {
    [primitiveTagNames.form]: PrimitiveFormElement;
  }
}
