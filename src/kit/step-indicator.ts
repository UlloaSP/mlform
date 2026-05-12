// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import { kitTagNames } from "./constants";

@customElement(kitTagNames.stepIndicator)
export class KitStepIndicatorElement extends LitElement {
  static styles = css`
    :host {
      display: block;
      min-width: 0;
    }

    *,
    *::before,
    *::after {
      box-sizing: border-box;
    }

    .indicator {
      display: grid;
      gap: 0.5rem;
    }

    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
    }

    .step-label {
      font-size: var(--mlf-font-size-sm, 0.84rem);
      font-weight: 600;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: var(--mlf-color-text-muted, #475569);
    }

    .step-fraction {
      font-size: var(--mlf-font-size-sm, 0.84rem);
      font-weight: 700;
      color: var(--mlf-color-accent, #1e40af);
    }

    .track {
      height: 4px;
      border-radius: 999px;
      background: var(--mlf-color-border, #e2e8f0);
      overflow: hidden;
    }

    .fill {
      height: 100%;
      border-radius: 999px;
      background: var(--mlf-color-accent, #1e40af);
      transition: width 0.3s ease;
    }

    .dots {
      display: flex;
      gap: 0.4rem;
      flex-wrap: wrap;
    }

    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--mlf-color-border, #e2e8f0);
      transition:
        background-color 0.2s ease,
        transform 0.2s ease;
    }

    .dot.active {
      background: var(--mlf-color-accent, #1e40af);
      transform: scale(1.25);
    }

    .dot.done {
      background: color-mix(in srgb, var(--mlf-color-accent, #1e40af) 50%, transparent);
    }
  `;

  @property({ type: Number }) accessor current = 1;
  @property({ type: Number }) accessor total = 1;
  @property({ type: String }) accessor label = "Step";

  render() {
    const pct = this.total > 0 ? Math.round((this.current / this.total) * 100) : 0;

    return html`
      <div
        class="indicator"
        role="status"
        aria-label=${`${this.label} ${this.current} of ${this.total}`}
      >
        <div class="header">
          <span class="step-label">${this.label}</span>
          <span class="step-fraction">${this.current} / ${this.total}</span>
        </div>
        <div class="track" aria-hidden="true">
          <div class="fill" style="width: ${pct}%"></div>
        </div>
        <div class="dots" aria-hidden="true">
          ${Array.from({ length: this.total }, (_, i) => {
            const cls =
              i + 1 < this.current ? "dot done" : i + 1 === this.current ? "dot active" : "dot";
            return html`<div class=${cls}></div>`;
          })}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [kitTagNames.stepIndicator]: KitStepIndicatorElement;
  }
}
