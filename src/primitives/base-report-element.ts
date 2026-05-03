// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { css, LitElement, type CSSResultGroup } from "lit";
import { property } from "lit/decorators.js";
import type { ReportDescriptor } from "@/presentation";
import type { ReportController } from "@/runtime";
import { primitiveStaticText, type PrimitiveText } from "./constants";
import type {
  PrimitiveReportRenderContext,
  PrimitiveReportRequest,
  PrimitiveReportTransport,
} from "./types";

// report-frame.ts owns the subscription to ReportController and passes
// descriptor + context as properties to this element.  No second subscription
// is needed here — that would cause a redundant render on every state change.
export abstract class PrimitiveReportElement extends LitElement {
  static styles: CSSResultGroup = css`
    :host {
      display: block;
    }

    .empty {
      padding: 0.9rem 1rem;
      border-radius: var(--mlf-radius-md, 16px);
      border: var(--mlf-border-width, 1px) dashed var(--mlf-report-border, var(--mlf-color-border));
      color: var(--mlf-report-empty-color, var(--mlf-color-text-muted));
      background: var(
        --mlf-report-empty-bg,
        color-mix(in srgb, var(--mlf-color-accent) 6%, transparent)
      );
    }
  `;

  @property({ attribute: false }) accessor controller: ReportController | undefined;
  @property({ attribute: false }) accessor descriptor: ReportDescriptor | null = null;
  @property({ attribute: false }) accessor context: PrimitiveReportRenderContext | undefined;
  @property({ attribute: false }) accessor text: PrimitiveText = primitiveStaticText;
  @property({ attribute: false }) accessor transport: PrimitiveReportTransport | undefined;
  @property({ attribute: false }) accessor request: PrimitiveReportRequest | null = null;

  protected get props(): Record<string, unknown> {
    return this.descriptor?.props ?? {};
  }

  protected get reportContext(): PrimitiveReportRenderContext | undefined {
    return this.context;
  }
}
