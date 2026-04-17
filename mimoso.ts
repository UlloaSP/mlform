// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { css, html, LitElement } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import {
  primitiveStaticText,
  primitiveTagNames,
  type PrimitiveText,
} from "./src/primitives/constants";
import type { ExplanationRequest, ExplanationTransport } from "./src/primitives/types";

type ExplanationStatus = "idle" | "loading" | "done" | "error";

const extractErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === "string" && error.trim().length > 0) return error;
  return String(error);
};

const renderResultText = (result: unknown): string => {
  if (typeof result === "string") return result;
  try {
    return JSON.stringify(result, null, 2);
  } catch {
    return String(result);
  }
};

@customElement(primitiveTagNames.explanationPanel)
export class PrimitiveExplanationPanelElement extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    .divider {
      border: none;
      border-top: var(--mlf-border-width, 1px) solid
        var(--mlf-report-border, var(--mlf-color-border, #e2e8f0));
      margin: 0;
    }

    .panel {
      padding-top: 0.75rem;
    }

    .heading {
      margin: 0 0 0.5rem;
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--mlf-report-label-color, var(--mlf-color-text-muted, #475569));
    }

    .skeleton {
      height: 5rem;
      border-radius: var(--mlf-radius-md, 16px);
      border: var(--mlf-border-width, 1px) solid
        var(--mlf-report-border, var(--mlf-color-border, #e2e8f0));
      background: linear-gradient(
        90deg,
        color-mix(in srgb, var(--mlf-color-surface-muted, #f8fafc) 92%, transparent) 0%,
        color-mix(in srgb, var(--mlf-color-accent, #1e40af) 10%, var(--mlf-color-surface, #fff)) 50%,
        color-mix(in srgb, var(--mlf-color-surface-muted, #f8fafc) 92%, transparent) 100%
      );
      background-size: 220% 100%;
      animation: shimmer 1.6s linear infinite;
    }

    .error {
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

    .content {
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

    @keyframes shimmer {
      0% {
        background-position: 200% 0;
      }
      100% {
        background-position: -20% 0;
      }
    }
  `;

  @property({ attribute: false }) accessor transport: ExplanationTransport | undefined;
  @property({ attribute: false }) accessor request: ExplanationRequest | null = null;
  @property({ attribute: false }) accessor text: PrimitiveText = primitiveStaticText;

  @state() private accessor explanationStatus: ExplanationStatus = "idle";
  @state() private accessor explanationResult: unknown = undefined;
  @state() private accessor explanationError: string | null = null;

  #abortController: AbortController | null = null;
  #lastFetchedRequest: ExplanationRequest | null = null;

  protected willUpdate(changed: Map<string, unknown>): void {
    if (changed.has("request") || changed.has("transport")) {
      void this.#fetchExplanation();
    }
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.#abortController?.abort();
    this.#abortController = null;
  }

  render() {
    if (this.explanationStatus === "idle") {
      return html``;
    }

    const text = this.text;

    return html`
      <hr class="divider" />
      <div class="panel">
        <p class="heading">${text.explanationLabel}</p>
        ${this.#renderContent(text)}
      </div>
    `;
  }

  #renderContent(text: PrimitiveText) {
    switch (this.explanationStatus) {
      case "loading":
        return html`<div class="skeleton" aria-label=${text.explanationLoadingLabel}></div>`;
      case "error":
        return html`<div class="error">Error: ${this.explanationError}</div>`;
      case "done":
        return html`<pre class="content" role="region" aria-label=${text.explanationAriaLabel}>
${renderResultText(this.explanationResult)}</pre
        >`;
      default:
        return html``;
    }
  }

  async #fetchExplanation(): Promise<void> {
    if (!this.transport || !this.request) {
      return;
    }

    // Same request object reference → already fetched or fetching.
    if (this.request === this.#lastFetchedRequest) {
      return;
    }

    this.#abortController?.abort();
    const ac = new AbortController();
    this.#abortController = ac;
    this.#lastFetchedRequest = this.request;

    this.explanationStatus = "loading";
    this.explanationError = null;
    this.explanationResult = undefined;

    try {
      const result = await this.transport.submit({ ...this.request, signal: ac.signal });

      if (ac.signal.aborted) {
        return;
      }

      this.explanationResult = result;
      this.explanationStatus = "done";
    } catch (err: unknown) {
      if (ac.signal.aborted) {
        return;
      }

      this.explanationError = extractErrorMessage(err);
      this.explanationStatus = "error";
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [primitiveTagNames.explanationPanel]: PrimitiveExplanationPanelElement;
  }
}
