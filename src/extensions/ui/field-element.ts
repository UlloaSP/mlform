// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { type CSSResultGroup, css, LitElement, type TemplateResult } from "lit";
import { state } from "lit/decorators.js";

export type FieldState = "empty" | "success" | "error";

export abstract class FieldElement<V = unknown> extends LitElement {
  protected static baseStyles: CSSResultGroup = css`
    * {
      box-sizing: border-box;
    }
  `;

  @state() protected declare value: V;

  connectedCallback(): void {
    super.connectedCallback();
    this.value = undefined as V;
    this.dispatchState("empty");
  }

  protected dispatchState(state: FieldState, message = ""): void {
    this.dispatchEvent(
      new CustomEvent("field-state", {
        detail: { state, message, value: this.value },
        bubbles: true,
        composed: true,
      })
    );
  }

  abstract render(): TemplateResult;
}
