// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { FormController } from "@/runtime";
import { kitErrorMessages } from "./constants";
import type { ResolvedLayoutResult } from "./layout";
import type { ResolvedFormLayoutNode } from "./types";

const filterOpenSections = (
  nodes: readonly ResolvedFormLayoutNode[],
  openSectionIds: Set<string>,
): ResolvedFormLayoutNode[] =>
  nodes.flatMap<ResolvedFormLayoutNode>((node) => {
    if (node.kind === "section") {
      return openSectionIds.has(node.id) ? [node] : [];
    }
    return [node];
  });

export const validateCurrentWizardStep = async (
  form: FormController,
  resolvedLayout: ResolvedLayoutResult,
  stepIndex: number,
): Promise<boolean> => {
  if (resolvedLayout.layout.kind !== "wizard") {
    return false;
  }

  const currentStepId = resolvedLayout.layout.steps[stepIndex]?.id;
  if (!currentStepId) {
    return false;
  }

  const stepFields = form.fields.filter(
    (field) =>
      resolvedLayout.maps.fieldStepIds.get(field.id) === currentStepId && field.state.visible,
  );
  const results = await Promise.all(stepFields.map((field) => field.validate()));
  return results.every((result) => result.errors.length === 0);
};

export const getActiveLayoutNodes = (
  resolvedLayout: ResolvedLayoutResult,
  stepIndex: number,
  activeTabIndex: number,
  openSectionIds: Set<string>,
) => {
  switch (resolvedLayout.layout.kind) {
    case "stacked":
    case "split":
      return filterOpenSections(resolvedLayout.layout.children, openSectionIds);
    case "wizard":
      return filterOpenSections(
        resolvedLayout.layout.steps[stepIndex]?.children ?? [],
        openSectionIds,
      );
    case "tabs":
      return filterOpenSections(
        resolvedLayout.layout.tabs[activeTabIndex]?.children ?? [],
        openSectionIds,
      );
  }
};

export const assertDisclosureSection = (
  disclosureSections: readonly { id: string }[],
  sectionId: string,
): void => {
  if (!disclosureSections.some((section) => section.id === sectionId)) {
    throw new TypeError(kitErrorMessages.unknownDisclosureSection(sectionId));
  }
};
