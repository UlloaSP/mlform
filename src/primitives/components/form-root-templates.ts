// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { html, nothing, type TemplateResult } from "lit";
import { repeat } from "lit/directives/repeat.js";
import type { PrimitiveFormController } from "../controller-types";
import type { PrimitiveDescriptorRegistry } from "../descriptors";
import type { PrimitiveText } from "../constants";
import type {
  PrimitiveRegistry,
  PrimitiveReportFetchMode,
  PrimitiveReportTransport,
} from "../types";
import type { FormRenderState } from "./form-root-state";
import type { PresentedField, PresentedReport } from "./form-root-presenters";

const renderFieldFrames = (
  fields: readonly PresentedField[],
  registry: PrimitiveRegistry | undefined,
  descriptorRegistry: PrimitiveDescriptorRegistry | undefined,
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
          .descriptorRegistry=${descriptorRegistry}
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
  reportFetchMode: PrimitiveReportFetchMode,
  lastResult: PrimitiveFormController["state"]["lastResult"],
): TemplateResult => {
  const allIdle =
    reports.length > 0 && reports.every(({ controller }) => controller.state.status === "idle");
  const allLoading =
    reports.length > 0 && reports.every(({ controller }) => controller.state.status === "loading");

  if (allIdle) return renderEmptyReports(text);
  if (allLoading) return renderLoadingReports(text);

  return html`
    <div class="collection report-collection" part="report-list">
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
            .fetchMode=${reportFetchMode}
            .lastResult=${lastResult}
          ></mlf-report-frame>
        `,
      )}
    </div>
  `;
};

const renderEmptyReports = (text: PrimitiveText): TemplateResult => html`
  <div class="empty-report-state" role="status">
    <span class="empty-report-icon" aria-hidden="true">i</span>
    <div>
      <p class="empty-report-title">${text.reportsEmptyTitle}</p>
      <p class="empty-report-copy">${text.reportsEmptyBody}</p>
    </div>
  </div>
`;

const renderLoadingReports = (text: PrimitiveText): TemplateResult => html`
  <div
    class="empty-report-state loading-report-state"
    role="status"
    aria-live="polite"
    aria-busy="true"
  >
    <span class="empty-report-icon" aria-hidden="true">…</span>
    <div>
      <p class="empty-report-title">${text.reportStateTitle("loading")}</p>
      <p class="empty-report-copy">${text.reportStateMessage("loading", null)}</p>
    </div>
    <div class="report-skeleton" aria-hidden="true"><span></span><span></span><span></span></div>
  </div>
`;

export const renderStackedLayout = (options: {
  form: PrimitiveFormController;
  state: FormRenderState;
  visibleFields: readonly PresentedField[];
  reportsToRender: readonly PresentedReport[];
  showReports: boolean;
  registry: PrimitiveRegistry | undefined;
  descriptorRegistry: PrimitiveDescriptorRegistry | undefined;
  text: PrimitiveText;
  formLabel: string;
  reportsLabel: string;
  submitLabel: string;
  validatingLabel: string;
  submittingLabel: string;
  reportTransport: PrimitiveReportTransport | undefined;
  reportFetchMode: PrimitiveReportFetchMode;
  onSubmitRequest: () => Promise<void>;
}): TemplateResult => html`
  <div
    class="root stacked"
    data-lifecycle=${options.state.lifecycle}
    ?inert=${options.state.lifecycle === "suspended"}
    aria-disabled=${String(options.state.lifecycle === "suspended")}
  >
    <section class="panel form-pane" part="form-pane">
      <header class="pane-header">
        <div class="pane-copy">
          <p class="eyebrow">${options.text.formEyebrow}</p>
          <h1 class="pane-title">${options.formLabel}</h1>
        </div>
      </header>

      <div class="pane-body">
        <mlf-form-errors .form=${options.form} .text=${options.text}></mlf-form-errors>
        ${renderFieldFrames(
          options.visibleFields,
          options.registry,
          options.descriptorRegistry,
          options.text,
        )}
      </div>

      <div class="actions" part="actions">
        <mlf-submit-button
          .operation=${options.state.operation}
          .idleLabel=${options.submitLabel}
          .validatingLabel=${options.validatingLabel}
          .submittingLabel=${options.submittingLabel}
          @mlf-submit-request=${options.onSubmitRequest}
        ></mlf-submit-button>
      </div>
    </section>

    ${
      options.showReports
        ? html`
            <aside class="panel report-pane" part="report-pane">
              <header class="pane-header">
                <div class="pane-copy">
                  <p class="eyebrow">${options.text.reportEyebrow}</p>
                  <h2 class="pane-title">${options.reportsLabel}</h2>
                </div>
              </header>

              <div class="pane-body">
                ${renderReports(
                  options.reportsToRender,
                  options.registry,
                  options.text,
                  options.reportTransport,
                  options.reportFetchMode,
                  options.form.state.lastResult ?? null,
                )}
              </div>
            </aside>
          `
        : nothing
    }
  </div>
`;

export const renderSplitLayout = (options: {
  form: PrimitiveFormController;
  state: FormRenderState;
  visibleFields: readonly PresentedField[];
  reportsToRender: readonly PresentedReport[];
  showReports: boolean;
  registry: PrimitiveRegistry | undefined;
  descriptorRegistry: PrimitiveDescriptorRegistry | undefined;
  text: PrimitiveText;
  formLabel: string;
  reportsLabel: string;
  submitLabel: string;
  validatingLabel: string;
  submittingLabel: string;
  reportTransport: PrimitiveReportTransport | undefined;
  reportFetchMode: PrimitiveReportFetchMode;
  onSubmitRequest: () => Promise<void>;
}): TemplateResult => html`
  <div
    class="root split"
    data-lifecycle=${options.state.lifecycle}
    ?inert=${options.state.lifecycle === "suspended"}
    aria-disabled=${String(options.state.lifecycle === "suspended")}
  >
    <div class="split-shell">
      <section class="left-section" part="form-pane">
        <div class="form-inputs scroll-y">
          <header class="sticky-header">
            <h2>${options.formLabel}</h2>
          </header>

          <div class="split-content">
            <mlf-form-errors .form=${options.form} .text=${options.text}></mlf-form-errors>
            ${renderFieldFrames(
              options.visibleFields,
              options.registry,
              options.descriptorRegistry,
              options.text,
            )}
          </div>
        </div>

        <div class="form-actions" part="actions">
          <mlf-submit-button
            .operation=${options.state.operation}
            .idleLabel=${options.submitLabel}
            .validatingLabel=${options.validatingLabel}
            .submittingLabel=${options.submittingLabel}
            @mlf-submit-request=${options.onSubmitRequest}
          ></mlf-submit-button>
        </div>
      </section>

      ${
        options.showReports
          ? html`
              <section class="right-section" part="report-pane">
                <div class="results-area scroll-y">
                  <header class="sticky-header">
                    <h2>${options.reportsLabel}</h2>
                  </header>

                  <div class="split-content">
                    ${
                      options.reportsToRender.length > 0
                        ? renderReports(
                            options.reportsToRender,
                            options.registry,
                            options.text,
                            options.reportTransport,
                            options.reportFetchMode,
                            options.form.state.lastResult ?? null,
                          )
                        : renderEmptyReports(options.text)
                    }
                  </div>
                </div>
              </section>
            `
          : nothing
      }
    </div>
  </div>
`;
