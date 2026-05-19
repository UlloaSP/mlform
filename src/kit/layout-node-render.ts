// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { html, nothing, type TemplateResult } from "lit";
import { repeat } from "lit/directives/repeat.js";
import { primitiveStaticText, type PrimitiveRegistry, type PrimitiveText } from "@/primitives";
import type { FormViewController, FormViewSnapshot, ResolvedFormLayoutNode } from "./types";

type RenderLayoutNodeOptions = {
  node: ResolvedFormLayoutNode;
  view?: FormViewController;
  snapshot: FormViewSnapshot;
  registry: PrimitiveRegistry | undefined;
  primitiveText?: PrimitiveText;
  sectionClass: string;
  sectionCopyClass: string;
  sectionTitleClass: string;
  sectionDescriptionClass: string;
  childrenClass: string;
  groupBaseClass: string;
};

export const renderLayoutNode = ({
  node,
  view,
  snapshot,
  registry,
  primitiveText = primitiveStaticText,
  sectionClass,
  sectionCopyClass,
  sectionTitleClass,
  sectionDescriptionClass,
  childrenClass,
  groupBaseClass,
}: RenderLayoutNodeOptions): TemplateResult | typeof nothing => {
  switch (node.kind) {
    case "section": {
      const open = snapshot.disclosure?.openSectionIds.includes(node.id) ?? true;
      return html`
        <section class=${sectionClass} data-section-id=${node.id}>
          ${node.title || node.description
            ? html`
                <button
                  type="button"
                  class=${sectionCopyClass}
                  aria-expanded=${String(open)}
                  @click=${() => view?.toggleSection(node.id)}
                >
                  <span>
                    ${node.title
                      ? html`<span class=${sectionTitleClass}>${node.title}</span>`
                      : nothing}
                    ${node.description
                      ? html`<span class=${sectionDescriptionClass}>${node.description}</span>`
                      : nothing}
                  </span>
                  <span>${open ? "−" : "+"}</span>
                </button>
              `
            : nothing}
          ${open
            ? html`
                <div class=${childrenClass}>
                  ${repeat(
                    node.children,
                    (_, index) => `${node.id}-${index}`,
                    (child) =>
                      renderLayoutNode({
                        node: child,
                        view,
                        snapshot,
                        registry,
                        primitiveText,
                        sectionClass,
                        sectionCopyClass,
                        sectionTitleClass,
                        sectionDescriptionClass,
                        childrenClass,
                        groupBaseClass,
                      }),
                  )}
                </div>
              `
            : nothing}
        </section>
      `;
    }
    case "group":
      return html`
        <div
          class=${`${groupBaseClass}${node.columns ? ` columns-${node.columns}` : ""}`}
          data-group-id=${node.id}
        >
          ${repeat(
            node.children,
            (_, index) => `${node.id}-${index}`,
            (child) =>
              renderLayoutNode({
                node: child,
                view,
                snapshot,
                registry,
                primitiveText,
                sectionClass,
                sectionCopyClass,
                sectionTitleClass,
                sectionDescriptionClass,
                childrenClass,
                groupBaseClass,
              }),
          )}
        </div>
      `;
    case "field": {
      const field = snapshot.fields.find((entry) => entry.id === node.field);
      if (!field) {
        return nothing;
      }
      return html`
        <mlf-field-frame
          data-field-id=${field.id}
          .controller=${field.controller}
          .descriptor=${field.descriptor}
          .registry=${registry}
          .text=${primitiveText}
        ></mlf-field-frame>
      `;
    }
    case "report": {
      const report = snapshot.reports.find((entry) => entry.id === node.report);
      if (!report) {
        return nothing;
      }
      return html`
        <mlf-report-frame
          .controller=${report.controller}
          .descriptor=${report.descriptor}
          .registry=${registry}
          .text=${primitiveText}
          .lastResult=${snapshot.form.lastResult}
        ></mlf-report-frame>
      `;
    }
  }
};
