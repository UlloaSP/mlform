// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { css, LitElement } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { html, unsafeStatic } from "lit/static-html.js";
import type { FieldController, FieldDescriptor, FieldStateSnapshot } from "@/engine";
import { ControllerBinding } from "../controller-binding";
import {
  primitiveIdPrefixes,
  primitiveStaticText,
  primitiveTagNames,
  type PrimitiveText,
} from "../constants";
import type { PrimitiveFieldRenderContext, PrimitiveRegistry } from "../types";
import { joinMessages, toText } from "../utils";

let fieldFrameSequence = 0;

type CategoryOption = string | { label: string; value: string };

const normalizeCategoryOption = (option: CategoryOption): { label: string; value: string } => {
  return typeof option === "string" ? { label: option, value: option } : option;
};

const resolveFieldFeedbackComponent = (
  component: string,
  props: Record<string, unknown>,
): string => {
  if (component !== "declarative-field") {
    return component;
  }

  switch (props.widget) {
    case "text":
      return "text-field";
    case "number":
      return "number-field";
    case "boolean":
      return "boolean-field";
    case "select":
      return "category-field";
    case "date":
      return "date-field";
    case "time-series":
      return "time-series-field";
    default:
      return component;
  }
};

@customElement(primitiveTagNames.fieldFrame)
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
      transition: box-shadow 0.2s ease;
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

    .header {
      display: flex;
      align-items: start;
      justify-content: space-between;
      gap: 1rem;
      min-width: 0;
    }

    .label {
      margin: 0;
      min-width: 0;
      color: var(--mlf-field-label-color, var(--mlf-color-text, #0f172a));
      font-size: 1rem;
      font-weight: 600;
      line-height: 1.2;
      overflow-wrap: anywhere;
    }

    .help-btn {
      flex: 0 0 auto;
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
      min-width: 0;
      font-size: 0.875rem;
      line-height: 1.5;
      color: var(--mlf-field-description-color, var(--mlf-color-secondary, #475569));
      white-space: normal;
      overflow-wrap: anywhere;
    }

    .description.show {
      display: block;
    }

    .control-slot {
      min-width: fit-content;
    }

    .feedback {
      min-width: 0;
      font-size: 0.8rem;
      line-height: 1.5;
      white-space: normal;
      overflow-wrap: anywhere;
    }

    .feedback.success {
      color: var(--mlf-field-feedback-success, var(--mlf-color-success, #059669));
    }

    .feedback.error {
      color: var(--mlf-field-feedback-error, var(--mlf-color-danger, #dc2626));
    }
  `;

  @property({ attribute: false }) accessor controller: FieldController | undefined;
  @property({ attribute: false }) accessor registry: PrimitiveRegistry | undefined;
  @property({ attribute: false }) accessor text: PrimitiveText = primitiveStaticText;

  @state() private accessor descriptor: FieldDescriptor | null = null;
  @state() private accessor fieldState: FieldStateSnapshot | null = null;
  @state() private accessor descriptionVisible = false;

  readonly #instanceId = ++fieldFrameSequence;
  #memoizedContext: PrimitiveFieldRenderContext | undefined;
  #memoizedDescriptor: FieldDescriptor | null = null;
  #memoizedFieldState: FieldStateSnapshot | null = null;
  #memoizedControlId = "";
  #memoizedErrorId = "";

  readonly #binding = new ControllerBinding<FieldController>(this, (ctrl) => {
    this.descriptor = ctrl?.descriptor ?? null;
    this.fieldState = ctrl?.state ?? null;
    if (!this.descriptor?.props.description) {
      this.descriptionVisible = false;
    }
  });

  protected willUpdate(changedProperties: Map<string, unknown>): void {
    if (changedProperties.has("controller")) {
      this.#binding.bind(this.controller);
    }
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
    const hasIntroducedValue = this.#hasIntroducedValue(descriptor.component, props, state);
    const errorLabel = joinMessages(state.errors);
    const successLabel = this.#createSuccessMessage(descriptor.component, props, state);
    const showError = errorLabel.length > 0 && (state.touched || hasIntroducedValue);
    const feedback = showError
      ? { tone: "error", message: errorLabel }
      : hasIntroducedValue && state.valid
        ? { tone: "success", message: successLabel }
        : null;
    const toneClass = showError ? "error" : hasIntroducedValue && state.valid ? "success" : "";

    // errorId is stable (always present per field instance) so aria-describedby
    // never flickers — the aria-live on the sr-only span handles announcements.
    const controlId = `${primitiveIdPrefixes.fieldControl}-${this.controller?.id}-${this.#instanceId}`;
    const errorId = `${primitiveIdPrefixes.fieldErrors}-${this.controller?.id}-${this.#instanceId}`;
    const detailsId = `${primitiveIdPrefixes.fieldDescription}-${this.controller?.id}-${this.#instanceId}-details`;

    return html`
      <section
        class="tile ${toneClass}"
        aria-busy=${String(state.status === "validating")}
        aria-invalid=${String(!state.valid)}
      >
        <div class="header">
          <div class="label">${label}</div>
          <button
            class="help-btn"
            type="button"
            aria-label=${this.text.helpActionLabel}
            aria-expanded=${String(this.descriptionVisible)}
            aria-controls=${detailsId}
            ?disabled=${description.length === 0}
            @click=${this.#toggleDescription}
          >
            ${this.text.helpActionGlyph}
          </button>
        </div>

        ${description
          ? html`
              <div id=${detailsId} class="description ${this.descriptionVisible ? "show" : ""}">
                ${description}
              </div>
            `
          : html``}

        <div class="control-slot">
          ${component
            ? this.#renderResolvedRenderer(component, controlId, errorId)
            : html`
                <mlf-unsupported-component
                  role="field"
                  component=${descriptor.component}
                  .text=${this.text}
                ></mlf-unsupported-component>
              `}
        </div>

        ${feedback
          ? html`
              <div
                class="feedback ${feedback.tone}"
                role=${feedback.tone === "error" ? "alert" : "status"}
                aria-live="polite"
              >
                ${feedback.message}
              </div>
            `
          : html``}
      </section>
    `;
  }

  #renderResolvedRenderer(tagName: string, controlId: string, errorId: string) {
    const tag = unsafeStatic(tagName);
    const context = this.#getContext(controlId, errorId);
    return html`
      <${tag}
        .controller=${this.controller}
        .descriptor=${this.descriptor}
        .context=${context}
        .text=${this.text}
      ></${tag}>
    `;
  }

  #getContext(controlId: string, errorId: string): PrimitiveFieldRenderContext | undefined {
    if (
      this.descriptor === this.#memoizedDescriptor &&
      this.fieldState === this.#memoizedFieldState &&
      controlId === this.#memoizedControlId &&
      errorId === this.#memoizedErrorId
    ) {
      return this.#memoizedContext;
    }

    const context = this.#createContext(
      this.descriptor?.props ?? {},
      this.fieldState,
      controlId,
      errorId,
    );
    this.#memoizedDescriptor = this.descriptor;
    this.#memoizedFieldState = this.fieldState;
    this.#memoizedControlId = controlId;
    this.#memoizedErrorId = errorId;
    this.#memoizedContext = context;
    return context;
  }

  #createContext(
    props: Record<string, unknown>,
    state: FieldStateSnapshot | null,
    controlId: string,
    errorId: string,
  ): PrimitiveFieldRenderContext | undefined {
    if (!this.controller || !state) {
      return undefined;
    }

    const description =
      typeof props.description === "string" && props.description.length > 0
        ? props.description
        : undefined;
    const descriptionId = description
      ? `${primitiveIdPrefixes.fieldDescription}-${this.controller.id}-${this.#instanceId}`
      : undefined;

    // errorId is always included in describedBy so aria-describedby is stable.
    // When there are no errors the sr-only span is empty — no false announcement.
    const describedBy = [descriptionId, errorId].filter(Boolean).join(" ") || undefined;

    return {
      controlId,
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

  #createSuccessMessage(
    component: string,
    props: Record<string, unknown>,
    state: FieldStateSnapshot,
  ): string {
    const text = this.text;
    const resolvedComponent = resolveFieldFeedbackComponent(component, props);

    switch (resolvedComponent) {
      case "text-field": {
        const value = typeof props.value === "string" ? props.value : "";
        return value.length > 0 ? text.fieldTextRecorded(value.length) : text.fieldReady;
      }
      case "number-field": {
        const unit = typeof props.unit === "string" ? ` ${props.unit}` : "";
        return state.value === null || state.value === undefined || state.value === ""
          ? text.fieldReady
          : text.fieldValidNumber(state.value, unit);
      }
      case "category-field": {
        const selected = this.#resolveCategorySelection(props, state.value);
        return selected ? text.fieldCategorySelected(selected.label) : text.fieldSelectionReady;
      }
      case "date-field": {
        const value = typeof props.value === "string" ? props.value : "";
        return value.length > 0 ? text.fieldSelectedDate(value) : text.fieldDateReady;
      }
      case "boolean-field": {
        const trueLabel = toText(props.trueLabel, text.booleanTrue);
        const falseLabel = toText(props.falseLabel, text.booleanFalse);
        return text.fieldBooleanSelection(state.value === true ? trueLabel : falseLabel);
      }
      case "time-series-field": {
        const points = Array.isArray(props.value) ? props.value.length : 0;
        return text.fieldTimeSeriesRecorded(points);
      }
      default:
        return text.fieldReady;
    }
  }

  #hasIntroducedValue(
    component: string,
    props: Record<string, unknown>,
    state: FieldStateSnapshot,
  ): boolean {
    const resolvedComponent = resolveFieldFeedbackComponent(component, props);

    switch (resolvedComponent) {
      case "text-field":
        return typeof state.value === "string" && state.value.trim().length > 0;
      case "date-field":
        return typeof props.value === "string" && props.value.trim().length > 0;
      case "category-field":
        return this.#resolveCategorySelection(props, state.value) !== null;
      case "number-field":
        return (
          state.value !== null &&
          state.value !== undefined &&
          state.value !== "" &&
          !(typeof state.value === "number" && Number.isNaN(state.value))
        );
      case "boolean-field":
        return this.#hasExplicitConfiguredValue() || state.dirty || state.touched;
      case "time-series-field":
        return Array.isArray(props.value) && props.value.length > 0;
      default:
        return state.value !== null && state.value !== undefined && state.value !== "";
    }
  }

  #resolveCategorySelection(
    props: Record<string, unknown>,
    value: unknown,
  ): { label: string; value: string } | null {
    if (typeof value !== "string" || value.length === 0) {
      return null;
    }

    const options = Array.isArray(props.options) ? (props.options as CategoryOption[]) : [];
    return options.map(normalizeCategoryOption).find((option) => option.value === value) ?? null;
  }

  #hasExplicitConfiguredValue(): boolean {
    return this.controller?.config.defaultValue !== undefined;
  }

  #toggleDescription = (): void => {
    if (!this.descriptor?.props.description) {
      return;
    }

    this.descriptionVisible = !this.descriptionVisible;
  };
}

declare global {
  interface HTMLElementTagNameMap {
    [primitiveTagNames.fieldFrame]: PrimitiveFieldFrameElement;
  }
}
