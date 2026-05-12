// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { css, LitElement, type CSSResultGroup } from "lit";
import { property } from "lit/decorators.js";
import type { ExplanationDescriptor } from "@/presentation";
import type { ExplanationController } from "@/runtime";
import { primitiveStaticText, type PrimitiveText } from "./constants";
import type { PrimitiveExplanationRenderContext } from "./types";

/**
 * Base class for explanation renderer elements.
 *
 * Explanation plugin authors should extend this class and implement `render()`
 * to display the explanation result.  The `explanation-panel` frame component
 * drives the fetch lifecycle and passes `controller`, `descriptor`, `context`,
 * and `text` as properties — no second subscription is needed here.
 */
export abstract class PrimitiveExplanationElement extends LitElement {
  static styles: CSSResultGroup = css`
    :host {
      display: block;
    }
  `;

  @property({ attribute: false }) accessor controller: ExplanationController | undefined;
  @property({ attribute: false }) accessor descriptor: ExplanationDescriptor | null = null;
  @property({ attribute: false }) accessor context: PrimitiveExplanationRenderContext | undefined;
  @property({ attribute: false }) accessor text: PrimitiveText = primitiveStaticText;

  protected get props(): Record<string, unknown> {
    return this.descriptor?.props ?? {};
  }

  protected get explanationContext(): PrimitiveExplanationRenderContext | undefined {
    return this.context;
  }
}
