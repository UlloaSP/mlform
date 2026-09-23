// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import "@/primitives";

import { html } from "lit";
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
import { singlePageRootStyles } from "./styles";
import type { ReportFetchMode } from "@/view";

@customElement(kitTagNames.disclosure)
export class KitSinglePageElement extends KitViewElement {
  static styles = singlePageRootStyles;

  @property({ attribute: false }) accessor registry: PrimitiveRegistry | undefined;
  @property({ attribute: false }) accessor primitiveText: PrimitiveText = primitiveStaticText;
  @property({ attribute: false }) accessor reportTransport: PrimitiveReportTransport | undefined;
  @property({ attribute: false }) accessor reportFetchMode: ReportFetchMode = "lazy";
  @property({ type: String }) accessor submitLabel = "Submit";
  @property({ type: String }) accessor validatingLabel = "Validating...";
  @property({ type: String }) accessor submittingLabel = "Submitting...";
  @property({ attribute: false }) accessor sectionsOpen = (count: number): string =>
    `${count} sections open`;

  render() {
    const snapshot = this.snapshot;
    if (!snapshot || (snapshot.layout.kind !== "stacked" && snapshot.layout.kind !== "split")) {
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
        part="layout-panel"
        data-lifecycle=${snapshot.form.lifecycle}
        ?inert=${suspended}
        aria-disabled=${String(suspended)}
      >
        <div class="body">
          <mlf-form-errors .form=${this.view?.form} .text=${this.primitiveText}></mlf-form-errors>
          <div class="collection">
            ${repeat(
              snapshot.layout.children,
              (_, index) => `root-${index}`,
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
          <span>${this.sectionsOpen(snapshot.disclosure?.openSectionIds.length ?? 0)}</span>
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
}

declare global {
  interface HTMLElementTagNameMap {
    [kitTagNames.disclosure]: KitSinglePageElement;
  }
}
