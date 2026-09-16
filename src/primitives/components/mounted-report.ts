// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { css, html } from "lit";
import { customElement, query } from "lit/decorators.js";
import { PrimitiveReportElement } from "../base-report-element";
import { primitiveTagNames } from "../constants";

type ReportMountCleanup = () => void;
type ReportMountContext = { element: HTMLElement; [key: string]: unknown };
type ReportMount = (context: ReportMountContext) => ReportMountCleanup | void;

const errorText = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

@customElement(primitiveTagNames.mountedReport)
export class PrimitiveMountedReportElement extends PrimitiveReportElement {
  static styles = [
    PrimitiveReportElement.styles,
    css`
      :host {
        display: block;
      }

      .mount-host {
        display: block;
        min-width: 0;
      }
    `,
  ];

  @query(".mount-host") private accessor mountHost!: HTMLDivElement;

  #cleanup: ReportMountCleanup | null = null;
  #mountedDescriptor: unknown = null;
  #abortController: AbortController | null = null;

  protected updated(): void {
    if (this.descriptor === this.#mountedDescriptor) {
      return;
    }

    this.#teardown();
    this.#mountedDescriptor = this.descriptor;
    this.mountHost.replaceChildren();

    const mount = this.props.mount;
    const mountContext = this.props.mountContext;

    if (typeof mount !== "function" || !mountContext) {
      return;
    }

    this.#abortController = new AbortController();

    try {
      const cleanup = (mount as ReportMount)({
        ...(mountContext as Omit<ReportMountContext, "element">),
        element: this.mountHost,
        signal: this.#abortController.signal,
      });
      this.#cleanup = typeof cleanup === "function" ? cleanup : null;
    } catch (error) {
      this.mountHost.textContent = `Report render failed: ${errorText(error)}`;
    }
  }

  disconnectedCallback(): void {
    this.#teardown();
    super.disconnectedCallback();
  }

  #teardown(): void {
    this.#abortController?.abort();
    this.#abortController = null;
    this.#cleanup?.();
    this.#cleanup = null;
  }

  render() {
    return html`<div class="mount-host" part="mount-host"></div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [primitiveTagNames.mountedReport]: PrimitiveMountedReportElement;
  }
}
