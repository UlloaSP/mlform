// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { css, html, LitElement } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { html as staticHtml, unsafeStatic } from "lit/static-html.js";
import type {
  ExplanationController,
  ExplanationFetchRequest,
  ExplanationStateSnapshot,
  SubmitResult,
} from "@/runtime";
import type { ExplanationDescriptor } from "@/presentation";
import { ControllerBinding } from "../controller-binding";
import {
  primitiveIdPrefixes,
  primitiveStaticText,
  primitiveTagNames,
  type PrimitiveText,
} from "../constants";
import type { PrimitiveExplanationRenderContext, PrimitiveRegistry } from "../types";
import { toText } from "../utils";

let explanationPanelSequence = 0;

@customElement(primitiveTagNames.explanationPanel)
export class PrimitiveExplanationPanelElement extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    :host([hidden]) {
      display: none;
    }

    .panel {
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

    .status {
      display: inline-flex;
      align-items: center;
      justify-content: center;
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

  @property({ attribute: false }) accessor controller: ExplanationController | undefined;
  @property({ attribute: false }) accessor registry: PrimitiveRegistry | undefined;
  @property({ attribute: false }) accessor lastResult: SubmitResult | null = null;
  @property({ attribute: false }) accessor text: PrimitiveText = primitiveStaticText;

  @property({ attribute: false }) accessor descriptor: ExplanationDescriptor | null = null;
  @state() private accessor resolvedDescriptor: ExplanationDescriptor | null = null;
  @state() private accessor explanationState: ExplanationStateSnapshot | null = null;

  readonly #instanceId = ++explanationPanelSequence;
  #memoizedLastResult: SubmitResult | null = null;
  #memoizedRequest: ExplanationFetchRequest | null = null;
  #memoizedContext: PrimitiveExplanationRenderContext | undefined;
  #memoizedController: ExplanationController | undefined;
  #memoizedDescriptor: ExplanationDescriptor | null = null;

  readonly #binding = new ControllerBinding<ExplanationController>(this, (ctrl) => {
    this.resolvedDescriptor = this.descriptor;
    this.explanationState = ctrl?.state ?? null;
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

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.controller?.abort();
  }

  render() {
    const descriptor = this.resolvedDescriptor;
    const state = this.explanationState;

    if (!descriptor || !state) {
      return html``;
    }

    const props = descriptor.props;
    const component = this.registry?.resolveExplanation(descriptor.component);

    return html`
      <div class="panel">
        <div class="header">
          <div class="copy">
            <p class="label">
              ${toText(props.label, this.controller?.config.label ?? this.text.explanationLabel)}
            </p>
            ${props.description
              ? html`<p class="description">${toText(props.description)}</p>`
              : html``}
          </div>
          <span class="status">${state.status}</span>
        </div>

        ${component
          ? this.#renderResolvedRenderer(component)
          : html`
              <mlf-unsupported-component
                role="explanation"
                component=${descriptor.component}
                .text=${this.text}
              ></mlf-unsupported-component>
            `}
      </div>
    `;
  }

  #renderResolvedRenderer(tagName: string) {
    const tag = unsafeStatic(tagName);
    const context = this.#getContext();
    const descriptor = this.resolvedDescriptor;

    return staticHtml`
      <${tag}
        .controller=${this.controller}
        .descriptor=${descriptor}
        .context=${context}
        .text=${this.text}
      ></${tag}>
    `;
  }

  #getContext(): PrimitiveExplanationRenderContext | undefined {
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

  #createContext(props: Record<string, unknown>): PrimitiveExplanationRenderContext | undefined {
    if (!this.controller) {
      return undefined;
    }

    return {
      regionId: `${primitiveIdPrefixes.explanationRegion}-${this.controller.id}-${this.#instanceId}`,
      label:
        typeof props.label === "string" && props.label.length > 0
          ? props.label
          : (this.controller.config.label ?? undefined),
      description:
        typeof props.description === "string" && props.description.length > 0
          ? props.description
          : undefined,
    };
  }

  /**
   * Builds an ExplanationFetchRequest from the last submit result, memoized by
   * result identity. Triggers controller.fetch() once per unique result.
   */
  #maybeFetch(): void {
    const result = this.lastResult;
    const ctrl = this.controller;

    if (!result || !ctrl) {
      return;
    }

    if (ctrl.state.status !== "idle") {
      return;
    }

    const request = this.#getRequest(result, ctrl.id);
    void ctrl.fetch(request);
  }

  #getRequest(result: SubmitResult, explanationId: string): ExplanationFetchRequest {
    if (
      result === this.#memoizedLastResult &&
      this.#memoizedRequest?.explanationId === explanationId
    ) {
      return this.#memoizedRequest!;
    }

    const request: ExplanationFetchRequest = {
      explanationId,
      backend: result.backend,
      values: result.values,
      fieldValues: result.fieldValues,
      serializedValues: result.serializedValues,
      serializedFieldValues: result.serializedFieldValues,
      reports: result.reports,
      meta: result.meta,
      raw: result.raw,
    };

    this.#memoizedLastResult = result;
    this.#memoizedRequest = request;
    return request;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [primitiveTagNames.explanationPanel]: PrimitiveExplanationPanelElement;
  }
}
