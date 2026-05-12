// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import "@/primitives/register";

import { html, LitElement, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { primitiveStaticText, type PrimitiveText } from "@/primitives/constants";
import type { PrimitiveRegistry } from "@/primitives/types";
import { accordionRootStyles } from "./accordion-root-styles";
import { kitTagNames } from "./constants";
import { renderLayoutNode } from "./layout-node-render";
import type { FormViewController, FormViewSnapshot } from "./types";

@customElement(kitTagNames.accordion)
export class KitAccordionElement extends LitElement {
  static styles = accordionRootStyles;

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
    const accordion = snapshot?.accordion;
    if (!snapshot || !accordion || snapshot.layout.kind !== "accordion") {
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
      <section class="root" part="accordion-panel">
        <header class="header">
          <h1 class="title">Accordion Form</h1>
          <div class="actions">
            <button type="button" class="btn" @click=${this.#handleOpenAll}>Open all</button>
            <button type="button" class="btn" @click=${this.#handleCloseAll}>Close all</button>
          </div>
        </header>

        <div class="body">
          ${repeat(
            snapshot.layout.sections,
            (section) => section.id,
            (section) => {
              const open = accordion.openSectionIds.includes(section.id);
              return html`
                <section class="section">
                  <button
                    type="button"
                    class="section-toggle"
                    aria-expanded=${String(open)}
                    @click=${() => this.view?.toggleSection(section.id)}
                  >
                    <span class="section-copy">
                      <span class="section-title">${section.title}</span>
                      ${section.description
                        ? html`<span class="section-description">${section.description}</span>`
                        : nothing}
                    </span>
                    <span class="chevron">${open ? "−" : "+"}</span>
                  </button>
                  ${open
                    ? html`
                        <div class="section-panel">
                          <div class="collection">
                            ${repeat(
                              section.children,
                              (_, index) => `${section.id}-${index}`,
                              (node) =>
                                renderLayoutNode({
                                  node,
                                  snapshot,
                                  registry: this.registry,
                                  primitiveText: this.primitiveText,
                                  sectionClass: "nested-section",
                                  sectionCopyClass: "nested-copy",
                                  sectionTitleClass: "nested-title",
                                  sectionDescriptionClass: "nested-description",
                                  childrenClass: "section-children",
                                  groupBaseClass: "group",
                                }),
                            )}
                          </div>
                        </div>
                      `
                    : nothing}
                </section>
              `;
            },
          )}
        </div>

        <footer class="footer" part="actions">
          <span>${accordion.openSectionIds.length} / ${accordion.sectionCount} open</span>
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

  #handleOpenAll = (): void => {
    this.view?.openAllSections();
  };

  #handleCloseAll = (): void => {
    this.view?.closeAllSections();
  };

  #handleSubmit = async (): Promise<void> => {
    await this.view?.submit();
  };
}

declare global {
  interface HTMLElementTagNameMap {
    [kitTagNames.accordion]: KitAccordionElement;
  }
}
