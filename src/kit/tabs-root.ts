// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import "@/primitives";

import { html, LitElement, nothing } from "lit";
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
import { tabsRootStyles } from "./tabs-root-styles";
import type { FormViewController, FormViewSnapshot } from "./types";

@customElement(kitTagNames.tabs)
export class KitTabsElement extends LitElement {
  static styles = tabsRootStyles;

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
    const tabsState = snapshot?.tabs;
    if (!snapshot || !tabsState || snapshot.layout.kind !== "tabs") {
      return html``;
    }

    const activeTab = snapshot.layout.tabs[tabsState.activeTabIndex];
    if (!activeTab) {
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
      <section class="root" part="tabs-panel">
        <div class="tablist" role="tablist" aria-label="Form sections">
          ${repeat(
            snapshot.layout.tabs,
            (tab) => tab.id,
            (tab, index) => html`
              <button
                type="button"
                class="tab"
                role="tab"
                aria-selected=${String(index === tabsState.activeTabIndex)}
                aria-controls=${`panel-${tab.id}`}
                id=${`tab-${tab.id}`}
                @click=${() => this.view?.setActiveTab(tab.id)}
              >
                ${tab.title}
              </button>
            `,
          )}
        </div>

        <div
          class="tab-panel"
          role="tabpanel"
          id=${`panel-${activeTab.id}`}
          aria-labelledby=${`tab-${activeTab.id}`}
        >
          ${activeTab.title || activeTab.description
            ? html`
                <header class="tab-header">
                  <h1 class="tab-title">${activeTab.title}</h1>
                  ${activeTab.description
                    ? html`<p class="tab-description">${activeTab.description}</p>`
                    : nothing}
                </header>
              `
            : nothing}

          <div class="body">
            <div class="collection">
              ${repeat(
                activeTab.children,
                (_, index) => `${activeTab.id}-${index}`,
                (node) =>
                  renderLayoutNode({
                    node,
                    snapshot,
                    registry: this.registry,
                    primitiveText: this.primitiveText,
                    sectionClass: "section",
                    sectionCopyClass: "section-copy",
                    sectionTitleClass: "section-title",
                    sectionDescriptionClass: "section-description",
                    childrenClass: "section-children",
                    groupBaseClass: "group",
                  }),
              )}
            </div>
          </div>
        </div>

        <footer class="footer" part="actions">
          <div class="nav">
            <button
              type="button"
              class="btn"
              ?disabled=${!tabsState.canGoPrev}
              @click=${() => this.view?.prevTab()}
            >
              Previous
            </button>
            <button
              type="button"
              class="btn"
              ?disabled=${!tabsState.canGoNext}
              @click=${() => this.view?.nextTab()}
            >
              Next
            </button>
          </div>
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
    [kitTagNames.tabs]: KitTabsElement;
  }
}
