// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import "@/primitives";

import { html, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import {
  focusPrimitiveField,
  primitiveStaticText,
  type PrimitiveRegistry,
  type PrimitiveReportTransport,
  type PrimitiveText,
} from "@/primitives";
import { kitTagNames } from "../constants";
import { revealFirstInvalidField } from "../shared/error-navigation";
import { indexLayoutItems, renderLayoutNode } from "../shared/layout-node-render";
import { KitViewElement } from "../shared/view-element";
import { tabsRootStyles } from "./styles";
import type { ReportFetchMode } from "@/view";

@customElement(kitTagNames.tabs)
export class KitTabsElement extends KitViewElement {
  static styles = tabsRootStyles;

  @property({ attribute: false }) accessor registry: PrimitiveRegistry | undefined;
  @property({ attribute: false }) accessor primitiveText: PrimitiveText = primitiveStaticText;
  @property({ attribute: false }) accessor reportTransport: PrimitiveReportTransport | undefined;
  @property({ attribute: false }) accessor reportFetchMode: ReportFetchMode = "lazy";
  @property({ type: String }) accessor submitLabel = "Submit";
  @property({ type: String }) accessor validatingLabel = "Validating...";
  @property({ type: String }) accessor submittingLabel = "Submitting...";
  @property({ type: String }) accessor previousLabel = "Previous";
  @property({ type: String }) accessor nextLabel = "Next";
  @property({ type: String }) accessor tabsLabel = "Form sections";

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

    const operation = snapshot.form.operation;
    const suspended = snapshot.form.lifecycle === "suspended";
    const submitText =
      operation === "validating"
        ? this.validatingLabel
        : operation === "submitting"
          ? this.submittingLabel
          : this.submitLabel;
    const itemIndex = indexLayoutItems(snapshot, this.reportPane);

    return html`
      <section
        class="root"
        part="tabs-panel"
        data-lifecycle=${snapshot.form.lifecycle}
        ?inert=${suspended}
        aria-disabled=${String(suspended)}
      >
        <div
          class="tablist"
          role="tablist"
          aria-label=${this.tabsLabel}
          @keydown=${this.#handleTabKeydown}
        >
          ${repeat(
            snapshot.layout.tabs,
            (tab) => tab.id,
            (tab, index) => html`
              <button
                type="button"
                class="tab"
                role="tab"
                tabindex=${index === tabsState.activeTabIndex ? 0 : -1}
                aria-selected=${String(index === tabsState.activeTabIndex)}
                aria-controls=${`panel-${tab.id}`}
                id=${`tab-${tab.id}`}
                @click=${() => void this.view?.navigation.activate(tab.id)}
              >
                ${tab.title}
              </button>
            `,
          )}
        </div>

        ${repeat(
          snapshot.layout.tabs,
          (tab) => tab.id,
          (tab) => html`
            <div
              class="tab-panel"
              role="tabpanel"
              id=${`panel-${tab.id}`}
              aria-labelledby=${`tab-${tab.id}`}
              ?hidden=${tab.id !== activeTab.id}
            >
              ${
                tab.id === activeTab.id
                  ? html`
                      ${
                        tab.title || tab.description
                          ? html`
                              <header class="tab-header">
                                <h1 class="tab-title">${tab.title}</h1>
                                ${tab.description ? html`<p class="tab-description">${tab.description}</p>` : nothing}
                              </header>
                            `
                          : nothing
                      }
                      <div class="body">
                        <mlf-form-errors
                          .form=${this.view?.form}
                          .text=${this.primitiveText}
                        ></mlf-form-errors>
                        <div class="collection">
                          ${repeat(
                            tab.children,
                            (_, index) => `${tab.id}-${index}`,
                            (node) =>
                              renderLayoutNode({
                                node,
                                view: this.view,
                                snapshot,
                                itemIndex,
                                registry: this.registry,
                                primitiveText: this.primitiveText,
                                reportTransport: this.reportTransport,
                                reportFetchMode: this.reportFetchMode,
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
                    `
                  : nothing
              }
            </div>
          `,
        )}

        <footer class="footer" part="actions">
          <div class="nav">
            <button
              type="button"
              class="btn"
              ?disabled=${suspended || !tabsState.canGoPrev}
              @click=${() => this.view?.navigation.previous()}
            >
              ${this.previousLabel}
            </button>
            <button
              type="button"
              class="btn"
              ?disabled=${suspended || !tabsState.canGoNext}
              @click=${() => void this.view?.navigation.next()}
            >
              ${this.nextLabel}
            </button>
          </div>
          <button
            type="button"
            class="btn btn-submit"
            ?disabled=${suspended || operation === "validating" || operation === "submitting"}
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
    } catch {
      await revealFirstInvalidField(this, this.view, focusPrimitiveField);
    }
  };

  #handleTabKeydown = async (event: KeyboardEvent): Promise<void> => {
    const snapshot = this.snapshot;
    if (!snapshot || snapshot.layout.kind !== "tabs" || !snapshot.tabs) return;

    const count = snapshot.layout.tabs.length;
    const current = snapshot.tabs.activeTabIndex;
    let next = current;
    switch (event.key) {
      case "ArrowRight":
        next = (current + 1) % count;
        break;
      case "ArrowLeft":
        next = (current - 1 + count) % count;
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = count - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    const tab = snapshot.layout.tabs[next];
    if (!tab) return;
    await this.view?.navigation.activate(tab.id);
    await this.updateComplete;
    this.renderRoot.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
  };
}

declare global {
  interface HTMLElementTagNameMap {
    [kitTagNames.tabs]: KitTabsElement;
  }
}
