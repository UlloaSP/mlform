import { css, html, LitElement } from "lit";
import { customElement, property, state } from "lit/decorators.js";

@customElement("field-wrapper")
export class FieldWrapper extends LitElement {
  static styles = css`
    :host {
      display: block;
      margin: 10px;
    }
    .tile {
      position: relative;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      background: var(--ml-color-surface);
      border: 1px solid var(--ml-color-border);
      border-radius: var(--radius);
      overflow: hidden;
      padding: 1.5rem 2rem;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
      transition: box-shadow 0.2s ease;
    }
    .tile:hover {
      box-shadow: 0 6px 18px rgba(0, 0, 0, 0.06);
    }
    .tile::before {
      content: "";
      position: absolute;
      left: 0;
      top: 0;
      width: 6px;
      height: 100%;
      background: var(--ml-color-accent);
      transition: background 0.2s ease;
    }
    .tile.success::before {
      background: var(--ml-color-success);
    }
    .tile.error::before {
      background: var(--ml-color-error);
    }
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.25rem;
    }
    label {
      font-weight: 600;
      font-size: 1rem;
      color: var(--ml-color-primary);
    }
    .help-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border: none;
      border-radius: 50%;
      background: var(--ml-color-accent);
      color: #fff;
      font-size: 1rem;
      cursor: pointer;
      transition: background 0.2s ease;
    }
    .help-btn:hover {
      background: var(--ml-color-accent-h);
    }
    .help-btn:disabled {
      background: var(--ml-color-secondary);
      cursor: not-allowed;
    }
    .description {
      display: none;
      font-size: 0.875rem;
      color: var(--ml-color-secondary);
    }
    .description.show {
      display: block;
    }
    .feedback {
      font-size: 0.8rem;
      margin-top: 0.25rem;
    }
    .feedback.error {
      color: var(--ml-color-error);
    }
    .feedback.success {
      color: var(--ml-color-success);
    }
  `;

  @property({ type: String }) declare title: string;
  @property({ type: String }) declare description: string;
  @state() private declare descriptionVisible: boolean;
  @state() private stateClass: "empty" | "success" | "error" = "empty";
  @state() declare feedback: string;
  @state() declare value: unknown;

  @property({ type: String, reflect: true }) declare name: string;

  connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener("field-state", this.onFieldState as EventListener);
  }

  disconnectedCallback(): void {
    this.removeEventListener("field-state", this.onFieldState as EventListener);
    super.disconnectedCallback();
  }

  firstUpdated() {
    this.name = this.title
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "_")
      .replace(/[^\w_]/g, "");
    this.descriptionVisible = false;
    this.dispatchState();
  }

  private toggleDescription = (): void => {
    this.descriptionVisible = !this.descriptionVisible;
  };

  private onFieldState = (
    e: CustomEvent<{
      state: "empty" | "success" | "error";
      message?: string;
      value?: unknown;
    }>
  ) => {
    e.stopPropagation();
    this.stateClass = e.detail.state;
    this.feedback = e.detail.message ?? "";
    this.value = e.detail.value;
    if (this.stateClass !== "empty" && this.name) {
      this.dispatchState();
    }
  };

  private dispatchState() {
    this.dispatchEvent(
      new CustomEvent("wrapper", {
        detail: { name: this.name, state: this.stateClass, value: this.value },
        bubbles: true,
        composed: true,
      })
    );
  }

  render() {
    const wrapperClass = this.stateClass !== "empty" ? this.stateClass : "";
    return html`
      <div class="tile ${wrapperClass}">
        <header>
          <label>${this.title}</label>
          <button
            class="help-btn"
            aria-label="Help"
            aria-expanded=${this.descriptionVisible}
            ?disabled=${!this.description}
            @click=${this.toggleDescription}
          >
            ?
          </button>
        </header>
        <pre class="description ${this.descriptionVisible ? "show" : ""}">
${this.description}
</pre
        >

        <slot></slot>

        <pre class="feedback ${this.stateClass}">${this.feedback}</pre>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "field-wrapper": FieldWrapper;
  }
}
