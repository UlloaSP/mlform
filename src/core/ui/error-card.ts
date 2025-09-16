import { css, html, LitElement, unsafeCSS } from "lit";
import { customElement, property } from "lit/decorators.js";

export class ApiError extends Error {
  statusCode?: number;
  code?: string;
  details?: string[];

  constructor(
    message: string,
    options?: { statusCode?: number; code?: string; details?: string[] }
  ) {
    super(message);
    this.name = "ApiError";
    this.statusCode = options?.statusCode;
    this.code = options?.code;
    this.details = options?.details;
  }
}

// Interface for error configuration
interface ErrorConfig {
  icon: string; // SVG string
  title: string;
  description: string;
  details?: (error: unknown) => string[];
}

@customElement("error-card")
export class ErrorCard extends LitElement {
  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100dvh;
      margin: 20px;
      --card-bg: #ffffff;
      --card-border: #e5e7eb;
      --text-primary: #1f2937;
      --text-secondary: #4b5563;
      --error-icon-color: #ef4444;
      --button-bg: #f3f4f6;
      --button-text: #1f2937;
      --button-hover-bg: #e5e7eb;
      --list-text: #6b7280;
    }

    /* Dark mode styles */
    html.dark :host {
     display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100dvh;
      margin: 20px;
      --card-bg: #1f2937;
      --card-border: #374151;
      --text-primary: #f9fafb;
      --text-secondary: #d1d5db;
      --error-icon-color: #f87171;
      --button-bg: #374151;
      --button-text: #e5e7eb;
      --button-hover-bg: #4b5563;
      --list-text: #9ca3af;
    }

    .error-card-container {
      background-color: var(--card-bg);
      color: var(--text-primary);
      border-radius: 5px; /* rounded-2xl */
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); /* subtle shadow */
      padding: 1.5rem; /* p-6 */
      border: 1px solid var(--card-border);
      display: flex;
      height: 100%;
      width: 100%;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 1rem; /* space-y-4 */
      animation: fade-slide-in 200ms ease-out forwards;
    }

    .error-card-icon {
      color: var(--error-icon-color);
      width: 3rem; /* w-12 */
      height: 3rem; /* h-12 */
    }

    .error-card-title {
      font-size: 1.25rem; /* text-xl */
      font-weight: 600; /* font-semibold */
    }

    .error-card-description {
      color: var(--text-secondary);
    }

    .error-card-details-list {
      list-style: disc;
      list-style-position: inside;
      font-size: 0.875rem; /* text-sm */
      color: var(--list-text);
      text-align: left;
      width: 100%;
      max-width: 16rem; /* max-w-xs */
    }

    .error-card-actions {
      display: flex;
      justify-content: center;
      gap: 1rem; /* gap-4 */
      padding-top: 0.5rem; /* pt-2 */
    }

    .error-card-button {
      padding: 0.5rem 1rem; /* px-4 py-2 */
      background-color: var(--button-bg);
      color: var(--button-text);
      border-radius: 0.375rem; /* rounded-md */
      transition: background-color 150ms ease-in-out; /* transition-colors */
      cursor: pointer;
      border: none;
    }

    .error-card-button:hover {
      background-color: var(--button-hover-bg);
    }

    @keyframes fade-slide-in {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `;

  @property({ type: Object })
  error: Error | null = null;

  @property({ type: Function })
  retry?: () => void;

  // Static map to store error configurations
  private static _errorMap = new Map<string, ErrorConfig>();

  /**
   * Registers custom error configurations.
   * @param map A record where keys are error identifiers and values are ErrorConfig objects.
   */
  static register(map: Record<string, ErrorConfig>) {
    for (const key in map) {
      if (Object.hasOwn(map, key)) {
        ErrorCard._errorMap.set(key, map[key]);
      }
    }
  }

  private static defaultErrorConfigs: Record<string, ErrorConfig> = {
    "generic-error": {
      icon: ``,
      title: "An Unexpected Error Occurred",
      description: "We're sorry, something went wrong. Please try again.",
    },
  };

  constructor() {
    super();
    // Initialize with default configurations
    ErrorCard.register(ErrorCard.defaultErrorConfigs);
  }

  private _getErrorConfig(): ErrorConfig {
    if (!this.error) {
      return ErrorCard._errorMap.get("generic-error")!;
    }
    // Fallback to generic error if no specific config is found
    // This will catch any plain Error object or unhandled ApiError
    return (
      ErrorCard._errorMap.get("generic-error") ||
      ErrorCard.defaultErrorConfigs["generic-error"]
    );
  }

  render() {
    if (!this.error) {
      return null;
    }

    const config = this._getErrorConfig();
    const details =
      config.details && this.error ? config.details(this.error) : [];

    return html`
      <div role="alertdialog" class="error-card-container">
        <div class="error-card-icon">
          ${unsafeCSS(config.icon)}
        </div>
        <h2 class="error-card-title">${config.title}</h2>
        <p class="error-card-description">${config.description}</p>

        ${
          details.length > 0
            ? html`
              <ul class="error-card-details-list">
                ${details.map((detail) => html`<li>${detail}</li>`)}
              </ul>
            `
            : ""
        }

        <div class="error-card-actions">
          <slot></slot>
          ${
            this.retry
              ? html`
                <button @click=${this.retry} class="error-card-button">
                  Retry
                </button>
              `
              : ""
          }
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "error-card": ErrorCard;
  }
}
