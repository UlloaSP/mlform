import { LitElement, html, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { DescriptorService } from "@/core/app";

@customElement("ml-layout")
export class MLLayout extends LitElement {
  static styles = css`
    :host {
      --color-bg: #f5f7fa;
      --color-surface: #ffffff;
      --color-primary: #0f172a;
      --color-secondary: #475569;
      --color-accent: #1e40af;
      --color-accent-h: #1d4ed8;
      --color-accent-bg: rgb(178, 178, 178);
      --color-bg-light: #f5f7fa;
      --color-bg-panel: #ffffff;
      --color-bg-header: rgba(0, 0, 0, 0.06);
      --color-border: #e2e8f0;
      --color-hv-light: #c7d2fe;
      --color-shadow: rgba(0, 0, 0, 0.04);
      --color-hv-shadow: rgba(0, 0, 0, 0.06);
      --color-error: #dc2626;
      --color-success: #059669;
      --radius: 12px;
      --skew: -12deg;
      --unit-w: 1rem;
      --blur-header: 3px;

      display: flex;
      height: 100dvh;
      width: 100%;
      overflow: hidden;
      margin: 0;
      background: var(--color-primary);
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
      background: var(--color-bg-header);
      padding: 0.5rem 2rem;
      border-bottom: 1px solid var(--color-border);
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
      background: var(--color-bg-panel);
      border-right: 1px solid var(--color-border);
      display: flex;
      flex-direction: column;
    }

    .right-section {
      flex: 1 1 0%;
      min-width: 24rem;
      overflow: hidden;
      background: var(--color-bg-panel);
      border-left: 1px solid var(--color-border);
      display: flex;
      flex-direction: column;
    }

    .form-inputs {
      flex: 1 1 auto;
    }
    .form-actions {
      padding: 1rem 2rem;
      border-top: 1px solid var(--color-border);
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

  @property({ type: String }) declare backendUrl: string;
  @state() private inputs: Record<
    string,
    [string, "empty" | "success" | "error"]
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

  private async _onSubmit() {
    const data: Record<string, string> = Object.fromEntries(
      Object.entries(this.inputs).map(([name, [value]]) => [name, value])
    );
    try {
      const res = await fetch(this.backendUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(res.statusText);
      const json = await res.json();
      this.modelService.render(json);
    } catch (err) {
      console.error("Error en fetch:", err);
    }
  }

  render() {
    return html`
      <section class="left-section">
        <form
          id="dynamic-form"
          action="${this.backendUrl}"
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
        <div class="results-area scroll-y">
          <div class="sticky-header"><h2>Report</h2></div>
            <slot name="report"></slot>
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
