// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { LitElement } from "lit";
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
  PrimitiveReportFetchMode,
  PrimitiveReportTransport,
  PrimitiveRegistry,
  PrimitiveReportRenderContext,
} from "../types";
import { toText } from "../utils";
import { helpButtonStyles } from "./help-button-styles";
import { reportFrameStyles } from "./report-frame-styles";

let reportFrameSequence = 0;

@customElement(primitiveTagNames.reportFrame)
export class PrimitiveReportFrameElement extends LitElement {
  static styles = [reportFrameStyles, helpButtonStyles];

  @property({ attribute: false }) accessor controller: PrimitiveReportController | undefined;
  @property({ attribute: false }) accessor registry: PrimitiveRegistry | undefined;
  @property({ attribute: false }) accessor text: PrimitiveText = primitiveStaticText;
  @property({ attribute: false }) accessor transport: PrimitiveReportTransport | undefined;
  @property({ attribute: false }) accessor fetchMode: PrimitiveReportFetchMode = "lazy";
  @property({ attribute: false }) accessor lastResult: PrimitiveSubmitResult | null = null;
  @property({ attribute: false }) accessor descriptor: ReportDescriptor | null = null;

  @state() private accessor resolvedDescriptor: ReportDescriptor | null = null;
  @state() private accessor reportState: PrimitiveReportStateSnapshot | null = null;
  @state() private accessor descriptionVisibilityOverride: boolean | null = null;

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
    if (changedProperties.has("controller")) this.#binding.bind(this.controller);

    if (changedProperties.has("descriptor")) {
      this.resolvedDescriptor = this.descriptor;
      if (!this.descriptor?.props.description) this.descriptionVisibilityOverride = null;
    }

    if (changedProperties.has("lastResult") || changedProperties.has("controller")) {
      this.#maybeFetch();
    }
  }

  render() {
    const descriptor = this.resolvedDescriptor;
    const state = this.reportState;
    if (!descriptor || !state) return html``;

    const props = descriptor.props;
    const component = this.registry?.resolveReport(descriptor.component);
    const label = toText(props.label, this.controller?.config.label ?? "");
    const description = toText(props.description);
    const descriptionVisible = this.#isDescriptionVisible(description);
    const descriptionId = `${primitiveIdPrefixes.reportDescription}-${this.controller?.id}-${this.#instanceId}`;

    return html`
      <section class="report">
        <div class="header">
          <p class="label">${label}</p>
          <button
            class="help-btn"
            type="button"
            aria-label=${`${this.text.helpActionLabel}: ${label}`}
            aria-expanded=${String(descriptionVisible)}
            aria-controls=${descriptionId}
            ?disabled=${description.length === 0}
            @click=${this.#toggleDescription}
          >
            ${this.text.helpActionGlyph}
          </button>
        </div>
        ${
          description
            ? html`<p id=${descriptionId} class="description" ?hidden=${!descriptionVisible}>
                ${description}
              </p>`
            : html``
        }
        ${
          state.status === "ready"
            ? component
              ? this.#renderResolvedRenderer(component)
              : html`<mlf-unsupported-component
                  role="report"
                  component=${descriptor.component}
                  .text=${this.text}
                ></mlf-unsupported-component>`
            : this.#renderState(state)
        }
      </section>
    `;
  }

  #renderState(state: PrimitiveReportStateSnapshot) {
    const isError = state.status === "error";
    return html`
      <div
        class="state-view ${isError ? "error" : ""}"
        role=${isError ? "alert" : "status"}
        aria-live=${isError ? "assertive" : "polite"}
        aria-busy=${String(state.status === "loading")}
      >
        <span class="state-marker" aria-hidden="true">
          ${isError ? "!" : state.status === "loading" ? "…" : "i"}
        </span>
        <div class="state-copy">
          <p class="state-title">${this.text.reportStateTitle(state.status)}</p>
          <p class="state-message">${this.text.reportStateMessage(state.status, state.error)}</p>
        </div>
        ${
          state.status === "loading"
            ? html`<div class="skeleton" aria-hidden="true">
                <span></span><span></span><span></span>
              </div>`
            : html``
        }
      </div>
    `;
  }

  #renderResolvedRenderer(tagName: string) {
    const tag = unsafeStatic(tagName);
    return html`
      <${tag}
        .controller=${this.controller}
        .descriptor=${this.resolvedDescriptor}
        .context=${this.#getContext()}
        .text=${this.text}
        .transport=${this.transport}
        .request=${this.#getReportRequest()}
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
    if (!this.controller) return undefined;
    return {
      regionId: `${primitiveIdPrefixes.reportRegion}-${this.controller.id}-${this.#instanceId}`,
      label: toText(props.label, this.controller.config.label ?? this.controller.id),
      description:
        typeof props.description === "string" && props.description.length > 0
          ? props.description
          : undefined,
    };
  }

  #getReportRequest(): PrimitiveReportRequest | null {
    const result = this.lastResult;
    if (!result || !this.controller) return null;
    if (
      result === this.#memoizedLastResult &&
      this.#memoizedRequest?.reportId === this.controller.id
    ) {
      return this.#memoizedRequest;
    }

    const request = createPrimitiveReportRequest(result, { reportId: this.controller.id });
    this.#memoizedLastResult = result;
    this.#memoizedRequest = request;
    return request;
  }

  #maybeFetch(): void {
    const ctrl = this.controller;
    const request = this.#getReportRequest();
    if (this.fetchMode !== "lazy" || !ctrl?.canFetch || !request || ctrl.state.status !== "idle") {
      return;
    }
    void ctrl.fetch(request);
  }

  #toggleDescription = (): void => {
    const description = toText(this.resolvedDescriptor?.props.description);
    if (!description) return;
    this.descriptionVisibilityOverride = !this.#isDescriptionVisible(description);
  };

  #isDescriptionVisible(description: string): boolean {
    if (!description) return false;
    return (
      this.descriptionVisibilityOverride ??
      this.resolvedDescriptor?.props.showDescriptionInline === true
    );
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [primitiveTagNames.reportFrame]: PrimitiveReportFrameElement;
  }
}
