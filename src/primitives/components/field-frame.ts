// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { css, LitElement } from "lit";
import { property, state } from "lit/decorators.js";
import { html, unsafeStatic } from "lit/static-html.js";
import type { FieldController, FieldDescriptor, FieldStateSnapshot } from "@/engine";
import type { PrimitiveFieldRenderContext, PrimitiveRegistry } from "../types";
import { joinMessages, toText } from "../utils";

let fieldFrameSequence = 0;

export class PrimitiveFieldFrameElement extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    :host([hidden]) {
      display: none;
    }

    .tile {
      position: relative;
      display: grid;
      gap: 0.85rem;
      overflow: hidden;
      padding: 1.5rem 2rem;
      border-radius: var(--mlf-field-radius, 12px);
      border: var(--mlf-border-width, 1px) solid
        var(--mlf-field-border, var(--mlf-color-border, #e2e8f0));
      background: var(--mlf-field-bg, var(--mlf-color-surface, #ffffff));
      box-shadow: 0 4px 12px var(--mlf-field-shadow, rgba(0, 0, 0, 0.04));
      transition:
        box-shadow 0.2s ease,
        transform 0.2s ease;
    }

    .tile:hover {
      box-shadow: 0 6px 18px var(--mlf-field-shadow-hover, rgba(0, 0, 0, 0.06));
    }

    .tile::before {
      content: "";
      position: absolute;
      inset: 0 auto 0 0;
      width: 6px;
      background: var(--mlf-field-accent, var(--mlf-color-accent, #1e40af));
      transition: background 0.2s ease;
    }

    .tile.success::before {
      background: var(--mlf-field-accent-success, var(--mlf-color-success, #059669));
    }

    .tile.error::before {
      background: var(--mlf-field-accent-error, var(--mlf-color-danger, #dc2626));
    }

    .tile.readonly::before,
    .tile.disabled::before {
      background: var(--mlf-field-accent-muted, var(--mlf-color-text-muted, #475569));
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: start;
      gap: 1rem;
    }

    .copy {
      display: grid;
      gap: 0.35rem;
      min-width: 0;
    }

    .label {
      margin: 0;
      color: var(--mlf-field-label-color, var(--mlf-color-text, #0f172a));
      font-size: 1rem;
      font-weight: 600;
      line-height: 1.2;
    }

    .actions {
      display: inline-flex;
      align-items: center;
      gap: 0.55rem;
      flex-shrink: 0;
    }

    .meta {
      display: inline-flex;
      align-items: center;
      min-height: 1.8rem;
      padding: 0.28rem 0.55rem;
      border-radius: 999px;
      background: var(
        --mlf-field-meta-bg,
        color-mix(in srgb, var(--mlf-color-accent, #1e40af) 10%, transparent)
      );
      color: var(--mlf-field-meta-color, var(--mlf-color-secondary, #475569));
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      white-space: nowrap;
    }

    .help-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      padding: 0;
      border: none;
      border-radius: 50%;
      background: var(--mlf-help-btn-bg, var(--mlf-color-accent, #1e40af));
      color: var(--mlf-help-btn-color, #ffffff);
      font-size: 1rem;
      font-weight: 700;
      cursor: pointer;
      transition: background 0.2s ease;
    }

    .help-btn:hover:not(:disabled) {
      background: var(--mlf-help-btn-bg-hover, var(--mlf-color-accent-hover, #1d4ed8));
    }

    .help-btn:disabled {
      background: var(--mlf-help-btn-bg-disabled, var(--mlf-color-text-muted, #475569));
      cursor: not-allowed;
      opacity: 0.7;
    }

    .description {
      display: none;
      margin: 0;
      font-size: 0.875rem;
      line-height: 1.5;
      color: var(--mlf-field-description-color, var(--mlf-color-secondary, #475569));
      white-space: pre-wrap;
    }

    .description.show {
      display: block;
    }

    .feedback {
      margin: 0;
      font-size: 0.8rem;
      line-height: 1.5;
      white-space: pre-wrap;
    }

    .feedback.error {
      color: var(--mlf-field-feedback-error, var(--mlf-color-danger, #dc2626));
    }
  `;

  @property({ attribute: false }) accessor controller: FieldController | undefined;
  @property({ attribute: false }) accessor registry: PrimitiveRegistry | undefined;

  @state() private accessor descriptor: FieldDescriptor | null = null;
  @state() private accessor fieldState: FieldStateSnapshot | null = null;
  @state() private accessor descriptionVisible = false;

  readonly #instanceId = ++fieldFrameSequence;
  #unsubscribe: (() => void) | null = null;
  #connectedController: FieldController | undefined;

  protected willUpdate(changedProperties: Map<string, unknown>): void {
    if (changedProperties.has("controller")) {
      this.#attachController();
    }
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.#attachController();
  }

  disconnectedCallback(): void {
    this.#unsubscribe?.();
    this.#unsubscribe = null;
    this.#connectedController = undefined;
    super.disconnectedCallback();
  }

  render() {
    const descriptor = this.descriptor;
    const state = this.fieldState;

    if (!descriptor || !state || !state.visible) {
      return html``;
    }

    const props = descriptor.props;
    const component = this.registry?.resolveField(descriptor.component);
    const label = toText(props.label, this.controller?.config.label ?? "");
    const description = toText(props.description);
    const badge = state.readOnly ? "read only" : state.disabled ? "disabled" : state.status;
    const errorLabel = joinMessages(state.errors);
    const toneClass = state.disabled
      ? "disabled"
      : state.readOnly
        ? "readonly"
        : state.errors.length > 0 || !state.valid
          ? "error"
          : state.status === "valid"
            ? "success"
            : "";

    return html`
      <section
        class="tile ${toneClass}"
        aria-busy=${String(state.status === "validating")}
        aria-invalid=${String(!state.valid)}
      >
        <header class="header">
          <div class="copy">
            <p class="label">${label}</p>
          </div>

          <div class="actions">
            <span class="meta">${badge}</span>
            <button
              class="help-btn"
              type="button"
              aria-label="Help"
              aria-expanded=${String(this.descriptionVisible)}
              ?disabled=${description.length === 0}
              @click=${this.#toggleDescription}
            >
              ?
            </button>
          </div>
        </header>

        ${description
          ? html`
              <p class="description ${this.descriptionVisible ? "show" : ""}">${description}</p>
            `
          : html``}
        ${component
          ? this.#renderResolvedRenderer(component)
          : html`
              <mlf-unsupported-component
                role="field"
                component=${descriptor.component}
              ></mlf-unsupported-component>
            `}
        ${errorLabel
          ? html` <p class="feedback error" role="alert" aria-live="polite">${errorLabel}</p> `
          : html``}
      </section>
    `;
  }

  #renderResolvedRenderer(tagName: string) {
    const tag = unsafeStatic(tagName);
    const context = this.#createContext(this.descriptor?.props ?? {}, this.fieldState);
    return html`
      <${tag}
        .controller=${this.controller}
        .descriptor=${this.descriptor}
        .context=${context}
      ></${tag}>
    `;
  }

  #createContext(
    props: Record<string, unknown>,
    state: FieldStateSnapshot | null,
  ): PrimitiveFieldRenderContext | undefined {
    if (!this.controller || !state) {
      return undefined;
    }

    const description =
      typeof props.description === "string" && props.description.length > 0
        ? props.description
        : undefined;
    const descriptionId = description
      ? `mlf-field-description-${this.controller.id}-${this.#instanceId}`
      : undefined;
    const errorId =
      state.errors.length > 0
        ? `mlf-field-errors-${this.controller.id}-${this.#instanceId}`
        : undefined;
    const describedBy = [descriptionId, errorId].filter(Boolean).join(" ") || undefined;

    return {
      controlId: `mlf-field-control-${this.controller.id}-${this.#instanceId}`,
      label: toText(props.label, this.controller.config.label),
      description,
      errors: state.errors,
      descriptionId,
      errorId,
      describedBy,
      invalid: !state.valid,
      required: Boolean(props.required),
      disabled: state.disabled,
      readOnly: state.readOnly,
    };
  }

  #toggleDescription = (): void => {
    if (!this.descriptor?.props.description) {
      return;
    }

    this.descriptionVisible = !this.descriptionVisible;
  };

  #attachController(): void {
    if (!this.isConnected) {
      return;
    }

    if (this.#connectedController === this.controller) {
      this.#syncFromController();
      return;
    }

    this.#unsubscribe?.();
    this.#unsubscribe = null;
    this.#connectedController = this.controller;
    this.#syncFromController();

    if (!this.controller) {
      return;
    }

    this.#unsubscribe = this.controller.subscribe(() => {
      this.#syncFromController();
    });
  }

  #syncFromController(): void {
    this.descriptor = this.controller?.descriptor ?? null;
    this.fieldState = this.controller?.state ?? null;

    if (!this.descriptor?.props.description) {
      this.descriptionVisible = false;
    }
  }
}

customElements.define("mlf-field-frame", PrimitiveFieldFrameElement);

declare global {
  interface HTMLElementTagNameMap {
    "mlf-field-frame": PrimitiveFieldFrameElement;
  }
}
