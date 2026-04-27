// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { css, html, nothing } from "lit";
import { state } from "lit/decorators.js";
import { PrimitiveReportElement } from "./base-report-element";
import type { PrimitiveText } from "./constants";
import type { PrimitiveReportRequest } from "./types";

export type PrimitiveAsyncReportStatus = "idle" | "loading" | "done" | "error";

const extractErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === "string" && error.trim().length > 0) return error;
  return String(error);
};

export const serializeReportTransportResult = (result: unknown): string => {
  if (typeof result === "string") return result;
  try {
    return JSON.stringify(result, null, 2);
  } catch {
    return String(result);
  }
};

export abstract class PrimitiveAsyncReportElement extends PrimitiveReportElement {
  static styles = [
    PrimitiveReportElement.styles,
    css`
      .transport-divider {
        border: none;
        border-top: var(--mlf-border-width, 1px) solid
          var(--mlf-report-border, var(--mlf-color-border, #e2e8f0));
        margin: 0;
      }

      .transport-panel {
        padding-top: 0.75rem;
      }

      .transport-heading {
        margin: 0 0 0.5rem;
        font-size: 0.72rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--mlf-report-label-color, var(--mlf-color-text-muted, #475569));
      }

      .transport-skeleton {
        height: 5rem;
        border-radius: var(--mlf-radius-md, 16px);
        border: var(--mlf-border-width, 1px) solid
          var(--mlf-report-border, var(--mlf-color-border, #e2e8f0));
        background: linear-gradient(
          90deg,
          color-mix(in srgb, var(--mlf-color-surface-muted, #f8fafc) 92%, transparent) 0%,
          color-mix(in srgb, var(--mlf-color-accent, #1e40af) 10%, var(--mlf-color-surface, #fff))
            50%,
          color-mix(in srgb, var(--mlf-color-surface-muted, #f8fafc) 92%, transparent) 100%
        );
        background-size: 220% 100%;
        animation: transport-shimmer 1.6s linear infinite;
      }

      .transport-error {
        padding: 0.75rem 1rem;
        border-radius: var(--mlf-radius-md, 16px);
        border: var(--mlf-border-width, 1px) solid
          color-mix(in srgb, var(--mlf-color-danger, #dc2626) 32%, transparent);
        background: color-mix(in srgb, var(--mlf-color-danger, #dc2626) 10%, transparent);
        color: var(--mlf-report-error-color, var(--mlf-color-danger, #dc2626));
        font-size: 0.84rem;
        font-family: var(
          --mlf-font-family-mono,
          "IBM Plex Mono",
          "SFMono-Regular",
          Consolas,
          "Liberation Mono",
          monospace
        );
        line-height: 1.5;
        word-break: break-word;
      }

      .transport-content {
        margin: 0;
        padding: 0.875rem 1rem;
        overflow-x: auto;
        white-space: pre-wrap;
        word-break: break-word;
        font: 500 0.82rem/1.5
          var(
            --mlf-font-family-mono,
            "IBM Plex Mono",
            "SFMono-Regular",
            Consolas,
            "Liberation Mono",
            monospace
          );
        color: var(--mlf-color-text, #0f172a);
        border-radius: var(--mlf-radius-md, 16px);
        border: var(--mlf-border-width, 1px) solid
          var(--mlf-report-border, var(--mlf-color-border, #e2e8f0));
        background: var(--mlf-report-bg, var(--mlf-color-surface, #ffffff));
      }

      @keyframes transport-shimmer {
        0% {
          background-position: 200% 0;
        }
        100% {
          background-position: -20% 0;
        }
      }
    `,
  ];

  @state() private accessor transportStatus: PrimitiveAsyncReportStatus = "idle";
  @state() private accessor transportResultValue: unknown = undefined;
  @state() private accessor transportErrorValue: string | null = null;

  #abortController: AbortController | null = null;
  #lastFetchedRequest: PrimitiveReportRequest | null = null;

  protected willUpdate(changedProperties: Map<string, unknown>): void {
    super.willUpdate(changedProperties);

    if (
      changedProperties.has("request") ||
      changedProperties.has("transport") ||
      changedProperties.has("descriptor")
    ) {
      void this.#refreshTransportResult();
    }
  }

  disconnectedCallback(): void {
    this.#abortController?.abort();
    this.#abortController = null;
    super.disconnectedCallback();
  }

  protected shouldFetchTransportResult(): boolean {
    return this.transport !== undefined && this.request !== null;
  }

  protected get transportResultStatus(): PrimitiveAsyncReportStatus {
    return this.transportStatus;
  }

  protected get transportResult(): unknown {
    return this.transportResultValue;
  }

  protected get transportError(): string | null {
    return this.transportErrorValue;
  }

  protected renderTransportPanel(text: PrimitiveText) {
    if (this.transportResultStatus === "idle") {
      return nothing;
    }

    return html`
      <hr class="transport-divider" />
      <div class="transport-panel">
        <p class="transport-heading">${text.explanationLabel}</p>
        ${this.#renderTransportContent(text)}
      </div>
    `;
  }

  #renderTransportContent(text: PrimitiveText) {
    switch (this.transportResultStatus) {
      case "loading":
        return html`<div
          class="transport-skeleton"
          aria-label=${text.explanationLoadingLabel}
        ></div>`;
      case "error":
        return html`<div class="transport-error">Error: ${this.transportError}</div>`;
      case "done":
        return html`<pre
          class="transport-content"
          role="region"
          aria-label=${text.explanationAriaLabel}
        >
${serializeReportTransportResult(this.transportResult)}</pre
        >`;
      default:
        return nothing;
    }
  }

  async #refreshTransportResult(): Promise<void> {
    const transport = this.transport;
    const request = this.request;

    if (!this.shouldFetchTransportResult() || !transport || !request) {
      this.#abortController?.abort();
      this.#abortController = null;
      this.#lastFetchedRequest = null;
      this.transportStatus = "idle";
      this.transportResultValue = undefined;
      this.transportErrorValue = null;
      return;
    }

    if (request === this.#lastFetchedRequest) {
      return;
    }

    this.#abortController?.abort();
    const abortController = new AbortController();
    this.#abortController = abortController;
    this.#lastFetchedRequest = request;

    this.transportStatus = "loading";
    this.transportResultValue = undefined;
    this.transportErrorValue = null;

    try {
      const result = await transport.submit({ ...request, signal: abortController.signal });

      if (abortController.signal.aborted) {
        return;
      }

      this.transportResultValue = result;
      this.transportStatus = "done";
    } catch (error: unknown) {
      if (abortController.signal.aborted) {
        return;
      }

      this.transportErrorValue = extractErrorMessage(error);
      this.transportStatus = "error";
    }
  }
}
