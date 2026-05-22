// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { css, LitElement } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { html, unsafeStatic } from "lit/static-html.js";
import type {
  PrimitiveReportController,
  PrimitiveReportStateSnapshot,
  PrimitiveSubmitResult,
} from "../controller-types";
import { createPrimitiveReportRequest } from "../controller-types";
import type { ReportDescriptor } from "../descriptors";
import { ControllerBinding } from "../controller-binding";
import {
  primitiveIdPrefixes,
  primitiveStaticText,
  primitiveTagNames,
  type PrimitiveText,
} from "../constants";
import type {
  PrimitiveReportRequest,
  PrimitiveReportTransport,
  PrimitiveRegistry,
  PrimitiveReportRenderContext,
} from "../types";
import { toText } from "../utils";

let reportFrameSequence = 0;

@customElement(primitiveTagNames.reportFrame)
export class PrimitiveReportFrameElement extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    :host([hidden]) {
      display: none;
    }

    .report {
      display: grid;
      gap: 0.9rem;
      padding: 1.5rem 2rem;
      border-radius: var(--mlf-report-radius, 12px);
      border: var(--mlf-border-width, 1px) solid
        var(--mlf-report-border, var(--mlf-color-border, #e2e8f0));
      background: var(--mlf-report-bg, var(--mlf-color-surface, #ffffff));
      box-shadow:
        0 2px 4px var(--mlf-report-shadow-soft, rgba(0, 0, 0, 0.04)),
        0 8px 16px var(--mlf-report-shadow, rgba(0, 0, 0, 0.04));
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: start;
      gap: 1rem;
    }

    .copy {
      display: grid;
      gap: 0.35rem;
      min-width: 0;
    }

    .label {
      margin: 0;
      font-size: 0.875rem;
      font-weight: 600;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--mlf-report-label-color, var(--mlf-color-text-muted, #475569));
    }

    .description {
      margin: 0;
      font-size: 0.95rem;
      line-height: 1.5;
      color: var(--mlf-report-description-color, var(--mlf-color-text, #0f172a));
    }

    .meta {
      display: inline-flex;
      align-items: center;
      min-height: 1.8rem;
      padding: 0.28rem 0.55rem;
      border-radius: 999px;
      background: var(
        --mlf-report-meta-bg,
        color-mix(in srgb, var(--mlf-color-accent, #1e40af) 10%, transparent)
      );
      color: var(--mlf-report-meta-color, var(--mlf-color-secondary, #475569));
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      white-space: nowrap;
    }
  `;

  @property({ attribute: false }) accessor controller: PrimitiveReportController | undefined;
  @property({ attribute: false }) accessor registry: PrimitiveRegistry | undefined;
  @property({ attribute: false }) accessor text: PrimitiveText = primitiveStaticText;
  @property({ attribute: false }) accessor transport: PrimitiveReportTransport | undefined;
  @property({ attribute: false }) accessor lastResult: PrimitiveSubmitResult | null = null;

  @property({ attribute: false }) accessor descriptor: ReportDescriptor | null = null;
  @state() private accessor resolvedDescriptor: ReportDescriptor | null = null;
  @state() private accessor reportState: PrimitiveReportStateSnapshot | null = null;

  readonly #instanceId = ++reportFrameSequence;
  #memoizedContext: PrimitiveReportRenderContext | undefined;
  #memoizedController: PrimitiveReportController | undefined;
  #memoizedDescriptor: ReportDescriptor | null = null;
  #memoizedLastResult: PrimitiveSubmitResult | null = null;
  #memoizedRequest: PrimitiveReportRequest | null = null;

  readonly #binding = new ControllerBinding<PrimitiveReportController>(this, (ctrl) => {
    this.resolvedDescriptor = this.descriptor;
    this.reportState = ctrl?.state ?? null;
  });

  protected willUpdate(changedProperties: Map<string, unknown>): void {
    if (changedProperties.has("controller")) {
      this.#binding.bind(this.controller);
    }

    if (changedProperties.has("descriptor")) {
      this.resolvedDescriptor = this.descriptor;
    }

    if (changedProperties.has("lastResult") || changedProperties.has("controller")) {
      this.#maybeFetch();
    }
  }

  render() {
    const descriptor = this.resolvedDescriptor;
    const state = this.reportState;

    if (!descriptor || !state) {
      return html``;
    }

    const props = descriptor.props;
    const component = this.registry?.resolveReport(descriptor.component);

    return html`
      <section class="report">
        <div class="header">
          <div class="copy">
            <p class="label">${toText(props.label, this.controller?.config.label ?? "")}</p>
            ${props.description
              ? html`<p class="description">${toText(props.description)}</p>`
              : html``}
          </div>
          <span class="meta">${this.text.reportStatusLabel(state.status)}</span>
        </div>

        ${component
          ? this.#renderResolvedRenderer(component)
          : html`
              <mlf-unsupported-component
                role="report"
                component=${descriptor.component}
                .text=${this.text}
              ></mlf-unsupported-component>
            `}
      </section>
    `;
  }

  #renderResolvedRenderer(tagName: string) {
    const tag = unsafeStatic(tagName);
    const context = this.#getContext();
    const reportTransport = this.transport;
    const reportRequest = this.#getReportRequest();
    const descriptor = this.resolvedDescriptor;

    return html`
      <${tag}
        .controller=${this.controller}
        .descriptor=${descriptor}
        .context=${context}
        .text=${this.text}
        .transport=${reportTransport}
        .request=${reportRequest}
      ></${tag}>
    `;
  }

  #getContext(): PrimitiveReportRenderContext | undefined {
    if (
      this.controller === this.#memoizedController &&
      this.resolvedDescriptor === this.#memoizedDescriptor
    ) {
      return this.#memoizedContext;
    }

    const context = this.#createContext(this.resolvedDescriptor?.props ?? {});
    this.#memoizedController = this.controller;
    this.#memoizedDescriptor = this.resolvedDescriptor;
    this.#memoizedContext = context;
    return context;
  }

  #createContext(props: Record<string, unknown>): PrimitiveReportRenderContext | undefined {
    if (!this.controller) {
      return undefined;
    }

    return {
      regionId: `${primitiveIdPrefixes.reportRegion}-${this.controller.id}-${this.#instanceId}`,
      label: toText(props.label, this.controller.config.label ?? this.controller.id),
      description:
        typeof props.description === "string" && props.description.length > 0
          ? props.description
          : undefined,
    };
  }

  /**
   * Builds a PrimitiveReportRequest from the last submit result, memoized by
   * result identity so report renderers only re-fetch when a new submit completes.
   */
  #getReportRequest(): PrimitiveReportRequest | null {
    const result = this.lastResult;

    if (!result || !this.controller) {
      return null;
    }

    if (
      result === this.#memoizedLastResult &&
      this.#memoizedRequest?.reportId === this.controller.id
    ) {
      return this.#memoizedRequest;
    }

    const request: PrimitiveReportRequest = createPrimitiveReportRequest(result, {
      reportId: this.controller.id,
    });

    this.#memoizedLastResult = result;
    this.#memoizedRequest = request;
    return request;
  }

  #maybeFetch(): void {
    const ctrl = this.controller;
    const request = this.#getReportRequest();

    if (!ctrl?.canFetch || !request || ctrl.state.status !== "idle") {
      return;
    }

    void ctrl.fetch(request);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [primitiveTagNames.reportFrame]: PrimitiveReportFrameElement;
  }
}
