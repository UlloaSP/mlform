// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { LitElement } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { html, unsafeStatic } from "lit/static-html.js";
import type { FieldController, FieldStateSnapshot } from "@/runtime";
import type { FieldDescriptor } from "@/presentation";
import { ControllerBinding } from "../controller-binding";
import {
  primitiveIdPrefixes,
  primitiveStaticText,
  primitiveTagNames,
  type PrimitiveText,
} from "../constants";
import type { PrimitiveFieldRenderContext, PrimitiveRegistry } from "../types";
import { joinMessages, toText } from "../utils";
import { fieldFrameStyles } from "./field-frame-styles";
import { createFieldSuccessMessage, hasIntroducedValue } from "./field-frame-feedback";

let fieldFrameSequence = 0;

@customElement(primitiveTagNames.fieldFrame)
export class PrimitiveFieldFrameElement extends LitElement {
  static styles = fieldFrameStyles;

  @property({ attribute: false }) accessor controller: FieldController | undefined;
  @property({ attribute: false }) accessor descriptor: FieldDescriptor | null = null;
  @property({ attribute: false }) accessor registry: PrimitiveRegistry | undefined;
  @property({ attribute: false }) accessor text: PrimitiveText = primitiveStaticText;

  @state() private accessor resolvedDescriptor: FieldDescriptor | null = null;
  @state() private accessor fieldState: FieldStateSnapshot | null = null;
  @state() private accessor descriptionVisibilityOverride: boolean | null = null;

  readonly #instanceId = ++fieldFrameSequence;
  #memoizedContext: PrimitiveFieldRenderContext | undefined;
  #memoizedDescriptor: FieldDescriptor | null = null;
  #memoizedFieldState: FieldStateSnapshot | null = null;
  #memoizedControlId = "";
  #memoizedErrorId = "";

  readonly #binding = new ControllerBinding<FieldController>(this, (ctrl) => {
    this.resolvedDescriptor = this.descriptor;
    this.fieldState = ctrl?.state ?? null;
    if (!this.resolvedDescriptor?.props.description) {
      this.descriptionVisibilityOverride = null;
    }
  });

  protected willUpdate(changedProperties: Map<string, unknown>): void {
    if (changedProperties.has("controller")) {
      this.#binding.bind(this.controller);
    }

    if (changedProperties.has("descriptor")) {
      this.resolvedDescriptor = this.descriptor;
    }

    if (changedProperties.has("descriptor") && !this.resolvedDescriptor?.props.description) {
      this.descriptionVisibilityOverride = null;
    }
  }

  render() {
    const descriptor = this.resolvedDescriptor;
    const state = this.fieldState;

    if (!descriptor || !state || !state.visible) {
      return html``;
    }

    const props = descriptor.props;
    const component = this.registry?.resolveField(descriptor.component);
    const label = toText(props.label, this.controller?.config.label ?? "");
    const description = toText(props.description);
    const descriptionVisible = this.#isDescriptionVisible(description);
    const hasValue = hasIntroducedValue(
      descriptor.component,
      props,
      state,
      this.controller?.config.defaultValue,
    );
    const errorLabel = joinMessages(state.errors);
    const successLabel = createFieldSuccessMessage(descriptor.component, props, state, this.text);
    const showError = errorLabel.length > 0 && (state.touched || hasValue);
    const feedback = showError
      ? { tone: "error", message: errorLabel }
      : hasValue && state.valid
        ? { tone: "success", message: successLabel }
        : null;
    const toneClass = showError ? "error" : hasValue && state.valid ? "success" : "";

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
            aria-expanded=${String(descriptionVisible)}
            aria-controls=${detailsId}
            ?disabled=${description.length === 0}
            @click=${this.#toggleDescription}
          >
            ${this.text.helpActionGlyph}
          </button>
        </div>

        ${description
          ? html`
              <div id=${detailsId} class="description ${descriptionVisible ? "show" : ""}">
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
    const descriptor = this.resolvedDescriptor;
    return html`
      <${tag}
        .controller=${this.controller}
        .descriptor=${descriptor}
        .context=${context}
        .text=${this.text}
      ></${tag}>
    `;
  }

  #getContext(controlId: string, errorId: string): PrimitiveFieldRenderContext | undefined {
    if (
      this.resolvedDescriptor === this.#memoizedDescriptor &&
      this.fieldState === this.#memoizedFieldState &&
      controlId === this.#memoizedControlId &&
      errorId === this.#memoizedErrorId
    ) {
      return this.#memoizedContext;
    }

    const context = this.#createContext(
      this.resolvedDescriptor?.props ?? {},
      this.fieldState,
      controlId,
      errorId,
    );
    this.#memoizedDescriptor = this.resolvedDescriptor;
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

  #toggleDescription = (): void => {
    if (!this.resolvedDescriptor?.props.description) {
      return;
    }

    this.descriptionVisibilityOverride = !this.#isDescriptionVisible(
      toText(this.resolvedDescriptor.props.description),
    );
  };

  #isDescriptionVisible(description: string): boolean {
    if (description.length === 0) {
      return false;
    }

    return (
      this.descriptionVisibilityOverride ??
      this.resolvedDescriptor?.props.showDescriptionInline === true
    );
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [primitiveTagNames.fieldFrame]: PrimitiveFieldFrameElement;
  }
}
