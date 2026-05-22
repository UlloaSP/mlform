// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import "@/primitives";

import { html, LitElement } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import {
  focusPrimitiveField,
  primitiveStaticText,
  type PrimitiveRegistry,
  type PrimitiveText,
} from "@/primitives";
import { kitTagNames } from "./constants";
import { revealFirstInvalidField } from "./error-navigation";
import { renderLayoutNode } from "./layout-node-render";
import { disclosureRootStyles } from "./disclosure-root-styles";
import type { FormViewController, FormViewSnapshot } from "./types";

@customElement(kitTagNames.disclosure)
export class KitSinglePageElement extends LitElement {
  static styles = disclosureRootStyles;

  @property({ attribute: false }) accessor view: FormViewController | undefined;
  @property({ attribute: false }) accessor registry: PrimitiveRegistry | undefined;
  @property({ attribute: false }) accessor primitiveText: PrimitiveText = primitiveStaticText;
  @property({ type: String }) accessor submitLabel = "Submit";
  @property({ type: String }) accessor validatingLabel = "Validating...";
  @property({ type: String }) accessor submittingLabel = "Submitting...";

  @state() private accessor snapshot: FormViewSnapshot | null = null;

  #unsubscribe: (() => void) | null = null;

  protected willUpdate(changed: Map<string, unknown>): void {
    if (!changed.has("view")) {
      return;
    }

    this.#unsubscribe?.();
    this.#unsubscribe = null;
    this.snapshot = this.view?.getSnapshot() ?? null;
    if (this.view) {
      this.#unsubscribe = this.view.subscribe((snapshot) => {
        this.snapshot = snapshot;
      });
    }
  }

  disconnectedCallback(): void {
    this.#unsubscribe?.();
    this.#unsubscribe = null;
    super.disconnectedCallback();
  }

  render() {
    const snapshot = this.snapshot;
    if (!snapshot || (snapshot.layout.kind !== "stacked" && snapshot.layout.kind !== "split")) {
      return html``;
    }

    const status = snapshot.form.status;
    const submitText =
      status === "validating"
        ? this.validatingLabel
        : status === "submitting"
          ? this.submittingLabel
          : this.submitLabel;

    return html`
      <section class="root" part="layout-panel">
        <div class="body">
          <div class="collection">
            ${repeat(
              snapshot.layout.children,
              (_, index) => `root-${index}`,
              (node) =>
                renderLayoutNode({
                  node,
                  view: this.view,
                  snapshot,
                  registry: this.registry,
                  primitiveText: this.primitiveText,
                  sectionClass: "section",
                  sectionCopyClass: "section-toggle",
                  sectionTitleClass: "section-title",
                  sectionDescriptionClass: "section-description",
                  childrenClass: "section-panel",
                  groupBaseClass: "group",
                }),
            )}
          </div>
        </div>

        <footer class="footer" part="actions">
          <span>${snapshot.disclosure?.openSectionIds.length ?? 0} sections open</span>
          <button
            type="button"
            class="btn btn-submit"
            ?disabled=${status === "validating" || status === "submitting"}
            @click=${this.#handleSubmit}
          >
            ${submitText}
          </button>
        </footer>
      </section>
    `;
  }

  #handleSubmit = async (): Promise<void> => {
    if (!this.view) {
      return;
    }

    try {
      await this.view.submit();
    } catch (error) {
      const handled = await revealFirstInvalidField(this, this.view, focusPrimitiveField);
      if (!handled) {
        throw error;
      }
    }
  };
}

declare global {
  interface HTMLElementTagNameMap {
    [kitTagNames.disclosure]: KitSinglePageElement;
  }
}
