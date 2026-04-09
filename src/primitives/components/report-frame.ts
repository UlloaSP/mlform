// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { css, LitElement } from "lit";
import { property, state } from "lit/decorators.js";
import { html, unsafeStatic } from "lit/static-html.js";
import type { ReportController, ReportDescriptor, ReportStateSnapshot } from "@/engine";
import { primitiveIdPrefixes, primitiveTagNames } from "../constants";
import type { PrimitiveRegistry, PrimitiveReportRenderContext } from "../types";
import { toText } from "../utils";

let reportFrameSequence = 0;

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

  @property({ attribute: false }) accessor controller: ReportController | undefined;
  @property({ attribute: false }) accessor registry: PrimitiveRegistry | undefined;

  @state() private accessor descriptor: ReportDescriptor | null = null;
  @state() private accessor reportState: ReportStateSnapshot | null = null;

  readonly #instanceId = ++reportFrameSequence;
  #unsubscribe: (() => void) | null = null;
  #connectedController: ReportController | undefined;

  protected willUpdate(changedProperties: Map<string, unknown>): void {
    if (changedProperties.has("controller")) {
      this.#attachController();
    }
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.#attachController();
  }

  disconnectedCallback(): void {
    this.#unsubscribe?.();
    this.#unsubscribe = null;
    this.#connectedController = undefined;
    super.disconnectedCallback();
  }

  render() {
    const descriptor = this.descriptor;
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
          <span class="meta">${state.status}</span>
        </div>

        ${component
          ? this.#renderResolvedRenderer(component)
          : html`
              <mlf-unsupported-component
                role="report"
                component=${descriptor.component}
              ></mlf-unsupported-component>
            `}
      </section>
    `;
  }

  #renderResolvedRenderer(tagName: string) {
    const tag = unsafeStatic(tagName);
    const context = this.#createContext(this.descriptor?.props ?? {});
    return html`
      <${tag}
        .controller=${this.controller}
        .descriptor=${this.descriptor}
        .context=${context}
      ></${tag}>
    `;
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

  #attachController(): void {
    if (!this.isConnected) {
      return;
    }

    if (this.#connectedController === this.controller) {
      this.#syncFromController();
      return;
    }

    this.#unsubscribe?.();
    this.#unsubscribe = null;
    this.#connectedController = this.controller;
    this.#syncFromController();

    if (!this.controller) {
      return;
    }

    this.#unsubscribe = this.controller.subscribe(() => {
      this.#syncFromController();
    });
  }

  #syncFromController(): void {
    this.descriptor = this.controller?.descriptor ?? null;
    this.reportState = this.controller?.state ?? null;
  }
}

customElements.define(primitiveTagNames.reportFrame, PrimitiveReportFrameElement);

declare global {
  interface HTMLElementTagNameMap {
    [primitiveTagNames.reportFrame]: PrimitiveReportFrameElement;
  }
}
