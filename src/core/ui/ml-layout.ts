import { css, html, LitElement, render } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { DescriptorService } from "@/core/app";
import type { Output } from "../domain";

@customElement("ml-layout")
export class MLLayout extends LitElement {
  static styles = css`
    :host {
      --ml-color-bg: #f5f7fa;
      --ml-color-surface: #ffffff;
      --ml-color-primary: #0f172a;
      --ml-color-secondary: #475569;
      --ml-color-accent: #1e40af;
      --ml-color-accent-h: #1d4ed8;
      --ml-color-accent-bg: rgb(178, 178, 178);
      --ml-color-bg-light: #f5f7fa;
      --ml-color-bg-panel: #ffffff;
      --ml-color-bg-header: rgba(0, 0, 0, 0.06);
      --ml-color-border: #e2e8f0;
      --ml-color-hv-light: #c7d2fe;
      --ml-color-shadow: rgba(0, 0, 0, 0.04);
      --ml-color-hv-shadow: rgba(0, 0, 0, 0.06);
      --ml-color-error: #dc2626;
      --ml-color-success: #059669;
      --radius: 12px;
      --skew: -12deg;
      --unit-w: 1rem;
      --blur-header: 3px;

      display: flex;
      height: 100dvh;
      width: 100%;
      overflow: hidden;
      margin: 0;
      background: var(--ml-color-primary);
    }

    .scroll-y {
      overflow-y: auto;
      overflow-x: hidden;
    }

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
    }

    .left-section {
      resize: horizontal;
      overflow: hidden;
      min-width: 22rem;
      max-width: 48rem;
      background: var(--ml-color-bg-panel);
      border-right: 1px solid var(--ml-color-border);
      display: flex;
      flex-direction: column;
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

    .form-inputs {
      flex: 1 1 auto;
    }
    .form-actions {
      padding: 1rem 2rem;
      border-top: 1px solid var(--ml-color-border);
      background: #e7e9ec;
      align-items: center;
    }

    .results-area {
      flex: 1 1 auto;
    }

    .scroll-y::-webkit-scrollbar {
      width: 8px;
    }
    .scroll-y::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 4px;
    }
    .scroll-y:hover::-webkit-scrollbar-thumb {
      background: #94a3b8;
    }

    button {
      width: 100%;
      padding: 0.75rem;
      background-color: #0056b3;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 1rem;
      transition:
        background-color 0.2s ease-in-out,
        transform 0.2s ease-in-out;
      transform: skew(var(--skew));
    }

    button:hover:not([disabled]) {
      background-color: #003f8a;
    }

    button[disabled] {
      opacity: 0.6;
      cursor: not-allowed;
    }

    button:active:not([disabled]) {
      transform: scale(0.95) skew(var(--skew));
    }
  `;

  @state() private inputs: Record<
    string,
    [unknown, "empty" | "success" | "error"]
  > = {};

  @property({ attribute: false }) declare modelService: DescriptorService;

  private label: string = "Predict";

  connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener("wrapper", this._onWrapperChange as EventListener);
  }

  disconnectedCallback() {
    this.removeEventListener("wrapper", this._onWrapperChange as EventListener);
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
      const json: Output | undefined = await this.modelService.submit(data);
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
