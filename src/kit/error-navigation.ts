// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { findFieldFrame, scrollFieldFrameIntoView } from "@/primitives/components/error-focus";
import type { FormViewController, FormViewFieldItem, ResolvedFormLayoutNode } from "./types";

const waitForRender = async (host: HTMLElement): Promise<void> => {
  await Promise.resolve();
  if ("updateComplete" in host) {
    await (host as HTMLElement & { updateComplete: Promise<unknown> }).updateComplete;
  }
  await Promise.resolve();
};

const containsField = (nodes: readonly ResolvedFormLayoutNode[], fieldId: string): boolean =>
  nodes.some((node) => {
    if (node.kind === "field") {
      return node.field === fieldId;
    }

    return "children" in node && containsField(node.children, fieldId);
  });

const findAccordionSectionId = (view: FormViewController, fieldId: string): string | null => {
  const layout = view.getSnapshot().layout;
  if (layout.kind !== "accordion") {
    return null;
  }

  return layout.sections.find((section) => containsField(section.children, fieldId))?.id ?? null;
};

const firstInvalidField = (view: FormViewController): FormViewFieldItem | null => {
  const fields = view
    .getSnapshot()
    .fields.filter((field) => field.state.visible && field.state.errors.length > 0);
  const order = new Map(
    view.getLayoutReferences().fields.map((fieldId, index) => [fieldId, index]),
  );
  fields.sort((left, right) => (order.get(left.id) ?? 0) - (order.get(right.id) ?? 0));
  return fields[0] ?? null;
};

export const revealFirstInvalidField = async (
  host: HTMLElement,
  view: FormViewController,
): Promise<boolean> => {
  const field = firstInvalidField(view);
  if (!field) {
    return false;
  }

  const layoutKind = view.getSnapshot().layout.kind;

  if (layoutKind === "wizard" && field.stepId) {
    await view.goToStep(field.stepId);
  }

  if (layoutKind === "tabs" && field.tabId) {
    view.setActiveTab(field.tabId);
  }

  const sectionId = findAccordionSectionId(view, field.id);
  if (sectionId) {
    view.openSection(sectionId);
  }

  await waitForRender(host);
  return scrollFieldFrameIntoView(findFieldFrame(host.shadowRoot ?? host, field.id));
};
