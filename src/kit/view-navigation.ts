// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { FormController } from "@/runtime";
import { kitErrorMessages } from "./constants";
import type { ResolvedLayoutResult } from "./layout";

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
    case "single-page":
      return resolvedLayout.layout.children;
    case "wizard":
      return resolvedLayout.layout.steps[stepIndex]?.children ?? [];
    case "tabs":
      return resolvedLayout.layout.tabs[activeTabIndex]?.children ?? [];
    case "accordion":
      return resolvedLayout.layout.sections
        .filter((section) => openSectionIds.has(section.id))
        .flatMap((section) => section.children);
  }
};

export const assertAccordionSection = (
  resolvedLayout: ResolvedLayoutResult,
  accordionSections: readonly { id: string }[],
  sectionId: string,
): void => {
  if (resolvedLayout.layout.kind !== "accordion") {
    throw new TypeError(kitErrorMessages.nonAccordionToggleSection);
  }

  if (!accordionSections.some((section) => section.id === sectionId)) {
    throw new TypeError(kitErrorMessages.unknownAccordionSection(sectionId));
  }
};

export const assertAccordionLayout = (resolvedLayout: ResolvedLayoutResult): void => {
  if (resolvedLayout.layout.kind !== "accordion") {
    throw new TypeError(kitErrorMessages.nonAccordionToggleSection);
  }
};
