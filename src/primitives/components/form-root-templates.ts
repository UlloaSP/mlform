// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { html, nothing, type TemplateResult } from "lit";
import { repeat } from "lit/directives/repeat.js";
import type { FormController } from "@/runtime";
import type { PrimitiveText } from "../constants";
import type { PrimitiveRegistry, PrimitiveReportTransport } from "../types";
import type { FormRenderState } from "./form-root-state";
import type { PresentedField, PresentedReport } from "./form-root-presenters";

const renderFieldFrames = (
  fields: readonly PresentedField[],
  registry: PrimitiveRegistry | undefined,
  text: PrimitiveText,
): TemplateResult => html`
  <div class="collection" part="field-list">
    ${repeat(
      fields,
      (field) => field.controller.id,
      (field) => html`
        <mlf-field-frame
          data-field-id=${field.controller.id}
          .controller=${field.controller}
          .descriptor=${field.descriptor}
          .registry=${registry}
          .text=${text}
        ></mlf-field-frame>
      `,
    )}
  </div>
`;

const renderReports = (
  reports: readonly PresentedReport[],
  registry: PrimitiveRegistry | undefined,
  text: PrimitiveText,
  reportTransport: PrimitiveReportTransport | undefined,
  lastResult: FormController["state"]["lastResult"],
): TemplateResult => html`
  <div class="collection" part="report-list">
    ${repeat(
      reports,
      (report) => report.controller.id,
      (report) => html`
        <mlf-report-frame
          .controller=${report.controller}
          .descriptor=${report.descriptor}
          .registry=${registry}
          .text=${text}
          .transport=${reportTransport}
          .lastResult=${lastResult}
        ></mlf-report-frame>
      `,
    )}
  </div>
`;

export const renderStackedLayout = (options: {
  form: FormController;
  state: FormRenderState;
  visibleFields: readonly PresentedField[];
  reportsToRender: readonly PresentedReport[];
  showReports: boolean;
  registry: PrimitiveRegistry | undefined;
  text: PrimitiveText;
  formLabel: string;
  reportsLabel: string;
  submitLabel: string;
  validatingLabel: string;
  submittingLabel: string;
  reportTransport: PrimitiveReportTransport | undefined;
  onSubmitRequest: () => Promise<void>;
}): TemplateResult => html`
  <div class="root stacked">
    <section class="panel form-pane" part="form-pane">
      <header class="pane-header">
        <div class="pane-copy">
          <p class="eyebrow">${options.text.formEyebrow}</p>
          <h1 class="pane-title">${options.formLabel}</h1>
        </div>
        <span class="status">${options.text.formStatusLabel(options.state.status)}</span>
      </header>

      <div class="pane-body">
        <div class="meta">
          <span>${options.text.formMetaFields(options.visibleFields.length)}</span>
          <span>${options.text.formMetaReports(options.form.reports.length)}</span>
          <span>${options.text.formMetaSubmits(options.state.submitCount)}</span>
        </div>

        <mlf-form-errors .form=${options.form} .text=${options.text}></mlf-form-errors>
        ${renderFieldFrames(options.visibleFields, options.registry, options.text)}
      </div>

      <div class="actions" part="actions">
        <mlf-submit-button
          .status=${options.state.status}
          .idleLabel=${options.submitLabel}
          .validatingLabel=${options.validatingLabel}
          .submittingLabel=${options.submittingLabel}
          .loaded=${options.state.submissionLoaded}
          .total=${options.state.submissionTotal}
          .progressMessage=${options.state.submissionMessage}
          .sessionMessageCount=${options.state.submissionSessionMessageCount}
          @mlf-submit-request=${options.onSubmitRequest}
        ></mlf-submit-button>
      </div>
    </section>

    ${options.showReports
      ? html`
          <aside class="panel report-pane" part="report-pane">
            <header class="pane-header">
              <div class="pane-copy">
                <p class="eyebrow">${options.text.reportEyebrow}</p>
                <h2 class="pane-title">${options.reportsLabel}</h2>
              </div>
              <span class="status">${options.reportsToRender.length}</span>
            </header>

            <div class="pane-body">
              ${renderReports(
                options.reportsToRender,
                options.registry,
                options.text,
                options.reportTransport,
                options.form.state.lastResult ?? null,
              )}
            </div>
          </aside>
        `
      : nothing}
  </div>
`;

export const renderSplitLayout = (options: {
  form: FormController;
  state: FormRenderState;
  visibleFields: readonly PresentedField[];
  reportsToRender: readonly PresentedReport[];
  showReports: boolean;
  registry: PrimitiveRegistry | undefined;
  text: PrimitiveText;
  formLabel: string;
  reportsLabel: string;
  submitLabel: string;
  validatingLabel: string;
  submittingLabel: string;
  reportTransport: PrimitiveReportTransport | undefined;
  onSubmitRequest: () => Promise<void>;
}): TemplateResult => html`
  <div class="root split">
    <div class="split-shell">
      <section class="left-section" part="form-pane">
        <div class="form-inputs scroll-y">
          <header class="sticky-header">
            <h2>${options.formLabel}</h2>
            <span class="sticky-meta">${options.text.formStatusLabel(options.state.status)}</span>
          </header>

          <div class="split-content">
            <div class="meta">
              <span>${options.text.formMetaFields(options.visibleFields.length)}</span>
              <span>${options.text.formMetaReports(options.form.reports.length)}</span>
              <span>${options.text.formMetaSubmits(options.state.submitCount)}</span>
            </div>

            <mlf-form-errors .form=${options.form} .text=${options.text}></mlf-form-errors>
            ${renderFieldFrames(options.visibleFields, options.registry, options.text)}
          </div>
        </div>

        <div class="form-actions" part="actions">
          <mlf-submit-button
            .status=${options.state.status}
            .idleLabel=${options.submitLabel}
            .validatingLabel=${options.validatingLabel}
            .submittingLabel=${options.submittingLabel}
            .loaded=${options.state.submissionLoaded}
            .total=${options.state.submissionTotal}
            .progressMessage=${options.state.submissionMessage}
            .sessionMessageCount=${options.state.submissionSessionMessageCount}
            @mlf-submit-request=${options.onSubmitRequest}
          ></mlf-submit-button>
        </div>
      </section>

      ${options.showReports
        ? html`
            <section class="right-section" part="report-pane">
              <div class="results-area scroll-y">
                <header class="sticky-header">
                  <h2>${options.reportsLabel}</h2>
                  <span class="sticky-meta">${options.reportsToRender.length}</span>
                </header>

                <div class="split-content">
                  ${options.reportsToRender.length > 0
                    ? renderReports(
                        options.reportsToRender,
                        options.registry,
                        options.text,
                        options.reportTransport,
                        options.form.state.lastResult ?? null,
                      )
                    : html`
                        <div class="empty-report-state">
                          <p class="empty-report-title">${options.text.reportsEmptyTitle}</p>
                          <p class="empty-report-copy">${options.text.reportsEmptyBody}</p>
                        </div>
                      `}
                </div>
              </div>
            </section>
          `
        : nothing}
    </div>
  </div>
`;
