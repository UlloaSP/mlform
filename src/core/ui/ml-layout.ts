// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { css, html, LitElement, render } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { DescriptorService } from "@/core/app";

@customElement("ml-layout")
export class MLLayout extends LitElement {
  static styles = css`
    /* Light defaults (tokens live INSIDE the component) */
:host {
  color-scheme: light;

  /* --- Design tokens (light) --- */
  --ml-color-bg: #f5f7fa;
  --ml-color-surface: #ffffff;
  --ml-color-primary: #0f172a;     /* primary text */
  --ml-color-secondary: #475569;   /* secondary text */
  --ml-color-accent: #1e40af;      /* brand / CTA */
  --ml-color-accent-h: #1d4ed8;    /* brand hover */
  --ml-color-accent-bg: rgba(29, 78, 216, 0.10);
  --ml-color-bg-light: #f5f7fa;
  --ml-color-bg-panel: #ffffff;
  --ml-color-bg-header: rgba(255, 255, 255, 0.60); /* frosted header overlay */
  --ml-color-border: #e2e8f0;
  --ml-color-hv-light: #c7d2fe;
  --ml-color-shadow: rgba(0, 0, 0, 0.04);
  --ml-color-hv-shadow: rgba(0, 0, 0, 0.06);
  --ml-color-error: #dc2626;
  --ml-color-success: #059669;
  --ml-color-focus-ring: rgba(29, 78, 216, 0.45);

  --radius: 12px;
  --skew: -12deg;
  --unit-w: 1rem;
  --blur-header: 3px;

  /* --- Host box/layout --- */
  display: flex;
  flex-grow: 1;
  overflow: hidden;
  margin: 0;
  background: var(--ml-color-bg); /* FIX: was --ml-color-primary */
}

/* Dark overrides via attribute (cross-browser, no :host-context) */
:host([theme="dark"]) {
  color-scheme: dark;

  /* Surfaces & text */
  --ml-color-bg:        #020617;  /* app background */
  --ml-color-surface:   #0f172a;  /* cards/panels */
  --ml-color-primary:   #e5e7eb;  /* primary text */
  --ml-color-secondary: #94a3b8;  /* secondary text */

  /* Brand & interaction */
  --ml-color-accent:    #1d4ed8;
  --ml-color-accent-h:  #60a5fa;
  --ml-color-accent-bg: rgba(29, 78, 216, 0.22);

  /* Background variants */
  --ml-color-bg-light:  #0b1220;
  --ml-color-bg-panel:  #0f172a;
  --ml-color-bg-header: rgba(255, 255, 255, 0.06);

  /* Strokes, highlights, elevation */
  --ml-color-border:    #334155;
  --ml-color-hv-light:  #1e3a8a;
  --ml-color-shadow:    rgba(0, 0, 0, 0.60);
  --ml-color-hv-shadow: rgba(0, 0, 0, 0.80);

  /* Status */
  --ml-color-error:     #ef4444;
  --ml-color-success:   #10b981;

  /* Focus */
  --ml-color-focus-ring: rgba(96, 165, 250, 0.55);

  /* Geometry */
  --blur-header: 6px;
}

/* Ensure flex children can actually scroll */
.left-section,
.right-section,
.form-inputs,
.results-area {
  min-height: 0;
  min-width: 0;
}

/* Shared scrolling container */
.scroll-y {
  overflow-y: auto;
  overflow-x: hidden;

  /* Firefox scrollbar */
  scrollbar-color: #cbd5e1 transparent;
}
:host([theme="dark"]) .scroll-y {
  scrollbar-color: #475569 transparent;
}

/* WebKit scrollbar */
.scroll-y::-webkit-scrollbar { width: 8px; }
.scroll-y::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}
:host([theme="dark"]) .scroll-y::-webkit-scrollbar-thumb {
  background: #475569;
}

/* Sticky header */
.sticky-header {
  position: sticky;
  top: 0;
  z-index: 10;
  backdrop-filter: blur(var(--blur-header));
  -webkit-backdrop-filter: blur(var(--blur-header));
  background: var(--ml-color-bg-header);
  padding: 0.5rem 2rem;
  border-bottom: 1px solid var(--ml-color-border);
}
.sticky-header h2 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--ml-color-primary);
}

/* Left / Right panes */
.left-section {
  resize: horizontal;
  overflow: hidden;
  min-width: 22rem;
  max-width: 48rem;
  background: var(--ml-color-bg-panel);
  border-right: 1px solid var(--ml-color-border);
  display: flex;
  flex-direction: column;
  border-radius: 0; /* keep square; adjust if you need rounded panels */
}

.right-section {
  flex: 1 1 0%;
  min-width: 24rem;
  overflow: hidden;
  background: var(--ml-color-bg-panel);
  border-left: 1px solid var(--ml-color-border);
  display: flex;
  flex-direction: column;
}

/* Form regions */
.form-inputs { flex: 1 1 auto; }
.form-actions {
  padding: 1rem 2rem;
  border-top: 1px solid var(--ml-color-border);
  background: var(--ml-color-bg-light); /* tokenized (was hardcoded) */
  align-items: center;
}

/* Results region */
.results-area { flex: 1 1 auto; }

/* Buttons */
button {
  width: 100%;
  padding: 0.75rem;
  background-color: var(--ml-color-accent);
  color: #ffffff;
  border: none;
  border-radius: var(--radius);
  cursor: pointer;
  font-size: 1rem;
  transition:
    background-color 0.2s ease-in-out,
    transform 0.2s ease-in-out,
    box-shadow 0.2s ease-in-out;
  transform: skew(var(--skew));
  will-change: transform;
}

button:hover:not([disabled]) {
  background-color: var(--ml-color-accent-h);
}

button[disabled] {
  opacity: 0.6;
  cursor: not-allowed;
}

button:active:not([disabled]) {
  transform: scale(0.95) skew(var(--skew));
}

button:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--ml-color-focus-ring);
}

/* Respect reduced motion */
@media (prefers-reduced-motion: reduce) {
  button { transition: background-color 0.2s ease-in-out; }
  button:active:not([disabled]) { transform: skew(var(--skew)); }
}

  `;

  @state() private inputs: Record<
    string,
    [unknown, "empty" | "success" | "error"]
  > = {};

  @property({ attribute: false }) declare modelService: DescriptorService;

  private label: string = "Predict";

  private _mo?: MutationObserver;

  connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener("wrapper", this._onWrapperChange as EventListener);

    const sync = () => {
      const isDark = document.documentElement.classList.contains("dark");
      if (isDark) this.setAttribute("theme", "dark");
      else this.removeAttribute("theme");
    };
    sync();
    this._mo = new MutationObserver(sync);
    this._mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
  }

  disconnectedCallback() {
    this.removeEventListener("wrapper", this._onWrapperChange as EventListener);
    this._mo?.disconnect();
    super.disconnectedCallback();
  }

  private _onWrapperChange(
    e: CustomEvent<{
      name: string;
      value: string;
      state: "empty" | "success" | "error";
    }>
  ) {
    this.inputs[e.detail.name] = [e.detail.value, e.detail.state];
    this.requestUpdate();
  }

  private get _disableButton(): boolean {
    const allValid = Object.values(this.inputs).every(
      ([, state]) => state === "success"
    );

    const expectedCount = this.querySelectorAll("field-wrapper").length;
    const actualCount = Object.keys(this.inputs).length;
    return !(allValid && expectedCount === actualCount);
  }

  private async _onSubmit(): Promise<void> {
    /** 1. Preparación de la carga útil */
    const data: Record<string, unknown> = Object.fromEntries(
      Object.entries(this.inputs).map(([name, [value]]) => [
        name,
        value instanceof Date ? value.toISOString() : value,
      ])
    );

    this._hideError();
    try {
      /** 2. Envío al servicio */
      const json: Record<string, unknown> =
        await this.modelService.submit(data);
      if (json === undefined) {
        throw new Error(
          "La respuesta del servicio no es válida o llegó vacía."
        );
      } else {
        /** 3. Publicamos el evento con éxito */
        this.dispatchEvent(
          new CustomEvent("ml-submit", {
            detail: { inputs: data, response: json },
            bubbles: true,
            composed: true,
          })
        );
      }
    } catch (err) {
      this._clearSlot();
      this._showError(err as Error);
    }
  }

  private _clearSlot(): void {
    const reportSlot =
      document.querySelector<HTMLDivElement>('div[slot="report"]');
    if (reportSlot) {
      reportSlot.innerHTML = "";
    }
  }

  private _showError(error: Error): void {
    const resultsArea = this.shadowRoot?.querySelector<HTMLElement>(
      "div[id='results-area']"
    );
    if (resultsArea) resultsArea.classList.remove("scroll-y");

    // Hide the right-section and show the error-section
    const rightSection = this.querySelector<HTMLElement>("div[slot='report']");
    const errorSection = this.querySelector<HTMLElement>("div[slot='error']");

    if (rightSection) rightSection.style.display = "none";
    if (errorSection) errorSection.style.display = "block";

    if (errorSection) {
      // Clear previous content
      errorSection.innerHTML = "";
      render(
        html`<error-card .error=${error.message}></error-card>`,
        errorSection
      );
    }
  }
  private _hideError(): void {
    const resultsArea = this.shadowRoot?.querySelector<HTMLElement>(
      "div[id='results-area']"
    );
    if (resultsArea) resultsArea.classList.add("scroll-y");

    // Hide the right-section and show the error-section
    const rightSection = this.querySelector<HTMLElement>("div[slot='report']");
    const errorSection = this.querySelector<HTMLElement>("div[slot='error']");
    if (rightSection) rightSection.style.display = "block";
    if (errorSection) errorSection.style.display = "none";
  }

  render() {
    return html`
      <section class="left-section">
        <form
          id="dynamic-form"
          method="post"
          enctype="multipart/form-data"
          style="display:flex;flex-direction:column;height:100%"
        >
          <div class="form-inputs scroll-y">
            <div class="sticky-header"><h2>Form</h2></div>
            <slot name="inputs"></slot>
          </div>
          <div class="form-actions">
            <button
              type="button"
              class="predict-button"
              @click=${this._onSubmit}
              ?disabled=${this._disableButton}
            >
              ${this.label}
            </button>
          </div>
        </form>
      </section>

      <section class="right-section">
        <div id="results-area" class="results-area scroll-y">
          <div class="sticky-header"><h2>Report</h2></div>
            <slot name="report"></slot>
            <slot name="error"></slot>
          </div>
        </div>
      </section>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ml-layout": MLLayout;
  }
}
