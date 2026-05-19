// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { html, LitElement } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type { PresentationRegistry } from "@/presentation";
import { SubmissionAbortedError, type FormController } from "@/runtime";
import {
  primitiveDefaultLabels,
  primitiveEventNames,
  primitiveStaticText,
  primitiveTagNames,
  type PrimitiveText,
} from "../constants";
import type { PrimitiveLayout, PrimitiveRegistry, PrimitiveReportTransport } from "../types";
import { findFieldFrame, findFirstInvalidField, scrollFieldFrameIntoView } from "./error-focus";
import { formRootStyles } from "./form-root-styles";
import { presentVisibleFields, presentVisibleReports } from "./form-root-presenters";
import { renderSplitLayout, renderStackedLayout } from "./form-root-templates";
import {
  type FormRenderState,
  sameFormRenderState,
  selectFormRenderState,
} from "./form-root-state";

@customElement(primitiveTagNames.form)
export class PrimitiveFormElement extends LitElement {
  static styles = formRootStyles;

  @property({ attribute: false }) accessor form: FormController | undefined;
  @property({ attribute: false }) accessor registry: PrimitiveRegistry | undefined;
  @property({ attribute: false }) accessor presentationRegistry: PresentationRegistry | undefined;
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
  @property({ attribute: false }) accessor text: PrimitiveText = primitiveStaticText;
  @property({ attribute: false }) accessor reportTransport: PrimitiveReportTransport | undefined;

  @state() private accessor formState: FormRenderState | null = null;
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

    const text = this.text;
    const visibleFields = presentVisibleFields(
      form,
      state.visibleFieldIds,
      this.presentationRegistry,
    );
    const reportsToRender = presentVisibleReports(
      form,
      state.visibleReportIds,
      this.reportPane,
      this.presentationRegistry,
    );
    const showSplitReports =
      this.reportPane !== "hidden" && (form.reports.length > 0 || state.hasFormErrors);
    const showReports =
      this.layout === "split"
        ? showSplitReports
        : this.reportPane === "always"
          ? form.reports.length > 0
          : this.reportPane === "auto"
            ? reportsToRender.length > 0
            : false;

    if (this.layout === "split") {
      return renderSplitLayout({
        form,
        state,
        visibleFields,
        reportsToRender,
        showReports,
        registry: this.registry,
        presentationRegistry: this.presentationRegistry,
        text,
        formLabel: this.formLabel,
        reportsLabel: this.reportsLabel,
        submitLabel: this.submitLabel,
        validatingLabel: this.validatingLabel,
        submittingLabel: this.submittingLabel,
        reportTransport: this.reportTransport,
        onSubmitRequest: this.#handleSubmitRequest,
      });
    }

    return renderStackedLayout({
      form,
      state,
      visibleFields,
      reportsToRender,
      showReports,
      registry: this.registry,
      presentationRegistry: this.presentationRegistry,
      text,
      formLabel: this.formLabel,
      reportsLabel: this.reportsLabel,
      submitLabel: this.submitLabel,
      validatingLabel: this.validatingLabel,
      submittingLabel: this.submittingLabel,
      reportTransport: this.reportTransport,
      onSubmitRequest: this.#handleSubmitRequest,
    });
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
      const invalidField = this.form ? findFirstInvalidField(this.form.fields) : null;
      if (invalidField) {
        await scrollFieldFrameIntoView(findFieldFrame(this.shadowRoot ?? this, invalidField.id));
      }

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
      this.formState = this.form ? selectFormRenderState(this.form) : null;
      return;
    }

    this.#unsubscribe?.();
    this.#unsubscribe = null;
    this.#connectedForm = this.form;
    this.formState = this.form ? selectFormRenderState(this.form) : null;

    if (!this.form) {
      return;
    }

    const form = this.form;
    this.#unsubscribe = form.subscribeSelector(
      () => selectFormRenderState(form),
      (nextState) => {
        this.formState = nextState;
      },
      {
        equality: sameFormRenderState,
      },
    );
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [primitiveTagNames.form]: PrimitiveFormElement;
  }
}
