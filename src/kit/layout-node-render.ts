// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { html, nothing, type TemplateResult } from "lit";
import { repeat } from "lit/directives/repeat.js";
import { primitiveStaticText, type PrimitiveText } from "@/primitives/constants";
import type { PrimitiveRegistry } from "@/primitives/types";
import type { FormViewSnapshot, ResolvedFormLayoutNode } from "./types";

type RenderLayoutNodeOptions = {
  node: ResolvedFormLayoutNode;
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
    case "section":
      return html`
        <section class=${sectionClass} data-section-id=${node.id}>
          ${node.title || node.description
            ? html`
                <div class=${sectionCopyClass}>
                  ${node.title ? html`<h2 class=${sectionTitleClass}>${node.title}</h2>` : nothing}
                  ${node.description
                    ? html`<p class=${sectionDescriptionClass}>${node.description}</p>`
                    : nothing}
                </div>
              `
            : nothing}
          <div class=${childrenClass}>
            ${repeat(
              node.children,
              (_, index) => `${node.id}-${index}`,
              (child) =>
                renderLayoutNode({
                  node: child,
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
        </section>
      `;
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
    case "explanation": {
      const explanation = snapshot.explanations.find((entry) => entry.id === node.explanation);
      if (!explanation) {
        return nothing;
      }
      return html`
        <mlf-explanation-panel
          .controller=${explanation.controller}
          .descriptor=${explanation.descriptor}
          .registry=${registry}
          .text=${primitiveText}
          .lastResult=${snapshot.form.lastResult}
        ></mlf-explanation-panel>
      `;
    }
  }
};
