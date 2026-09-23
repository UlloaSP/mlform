// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { html, nothing, type TemplateResult } from "lit";
import { repeat } from "lit/directives/repeat.js";
import {
  primitiveStaticText,
  type PrimitiveRegistry,
  type PrimitiveReportTransport,
  type PrimitiveText,
} from "@/primitives";
import type {
  FormViewController,
  FormViewFieldItem,
  FormViewReportItem,
  FormViewSnapshot,
  ReportFetchMode,
  ResolvedFormLayoutNode,
} from "@/view";

type LayoutItemIndex = {
  fieldsById: ReadonlyMap<string, FormViewFieldItem>;
  reportsById: ReadonlyMap<string, FormViewReportItem>;
};

export const indexLayoutItems = (
  snapshot: FormViewSnapshot,
  reportPane: "auto" | "always" | "hidden" = "auto",
): LayoutItemIndex => ({
  fieldsById: new Map(snapshot.fields.map((field) => [field.id, field])),
  reportsById: new Map(
    (reportPane === "hidden" ? [] : snapshot.reports).map((report) => [report.id, report]),
  ),
});

type RenderLayoutNodeOptions = {
  node: ResolvedFormLayoutNode;
  view?: FormViewController;
  snapshot: FormViewSnapshot;
  itemIndex: LayoutItemIndex;
  registry: PrimitiveRegistry | undefined;
  primitiveText?: PrimitiveText;
  reportTransport?: PrimitiveReportTransport;
  reportFetchMode: ReportFetchMode;
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
  itemIndex,
  registry,
  primitiveText = primitiveStaticText,
  reportTransport,
  reportFetchMode,
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
          <button
            type="button"
            class=${sectionCopyClass}
            aria-expanded=${String(open)}
            @click=${() => view?.navigation.disclosure.toggle(node.id)}
          >
            <span class="section-label">
              <span class=${sectionTitleClass}>${node.title}</span>
              ${
                node.description
                  ? html`<span class=${sectionDescriptionClass}>${node.description}</span>`
                  : nothing
              }
            </span>
            <span class="section-toggle-icon" aria-hidden="true">${open ? "−" : "+"}</span>
          </button>
          ${
            open
              ? html`
                  <div id=${`${node.id}-panel`} class=${childrenClass}>
                    ${repeat(
                      node.children,
                      (_, index) => `${node.id}-${index}`,
                      (child) =>
                        renderLayoutNode({
                          node: child,
                          view,
                          snapshot,
                          itemIndex,
                          registry,
                          primitiveText,
                          reportTransport,
                          reportFetchMode,
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
              : nothing
          }
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
                itemIndex,
                registry,
                primitiveText,
                reportTransport,
                reportFetchMode,
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
      const field = itemIndex.fieldsById.get(node.field);
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
      const report = itemIndex.reportsById.get(node.report);
      if (!report) {
        return nothing;
      }
      return html`
        <mlf-report-frame
          .controller=${report.controller}
          .descriptor=${report.descriptor}
          .registry=${registry}
          .text=${primitiveText}
          .transport=${reportTransport}
          .fetchMode=${reportFetchMode}
          .lastResult=${snapshot.form.lastResult}
        ></mlf-report-frame>
      `;
    }
  }
};
