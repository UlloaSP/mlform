// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { createIndexedPanelState } from "./panel-nav";
import type {
  AccordionState,
  FormViewState,
  TabsState,
  WizardState,
  ResolvedFormLayout,
} from "./types";

type LayoutStateOptions = {
  layout: ResolvedFormLayout;
  stepIndex: number;
  activeTabIndex: number;
  openSectionIds: Set<string>;
  formState: FormViewState["form"];
};

export const getWizardState = ({
  layout,
  stepIndex,
  formState,
}: LayoutStateOptions): WizardState | null => {
  const wizardSteps = layout.kind === "wizard" ? layout.steps : ([] as const);
  const panel = createIndexedPanelState(
    "wizard-step",
    stepIndex,
    wizardSteps.map((step) => step.id),
  );
  if (!panel) {
    return null;
  }

  return {
    stepIndex: panel.index,
    stepCount: panel.count,
    currentStepId: panel.currentId,
    canNext: formState.status !== "validating" && formState.status !== "submitting",
    canPrev: panel.canGoPrev,
    isLastStep: panel.index === panel.count - 1,
  };
};

export const getTabsState = ({ layout, activeTabIndex }: LayoutStateOptions): TabsState | null => {
  const tabs = layout.kind === "tabs" ? layout.tabs : ([] as const);
  const panel = createIndexedPanelState(
    "tab",
    activeTabIndex,
    tabs.map((tab) => tab.id),
  );
  if (!panel) {
    return null;
  }

  return {
    activeTabIndex: panel.index,
    tabCount: panel.count,
    currentTabId: panel.currentId,
    canGoNext: panel.canGoNext,
    canGoPrev: panel.canGoPrev,
  };
};

export const getAccordionState = ({
  layout,
  openSectionIds,
}: LayoutStateOptions): AccordionState | null => {
  const accordionSections = layout.kind === "accordion" ? layout.sections : ([] as const);
  if (accordionSections.length === 0) {
    return null;
  }

  return {
    openSectionIds: accordionSections
      .map((section) => section.id)
      .filter((sectionId) => openSectionIds.has(sectionId)),
    sectionCount: accordionSections.length,
  };
};

export const createFormViewState = (options: LayoutStateOptions): FormViewState => ({
  form: options.formState,
  wizard: getWizardState(options),
  tabs: getTabsState(options),
  accordion: getAccordionState(options),
});

export const isVisibleInLayout = (
  layout: ResolvedFormLayout,
  stepIndex: number,
  activeTabIndex: number,
  openSectionIds: Set<string>,
  stepId: string | null,
  tabId: string | null,
): boolean => {
  if (layout.kind !== "wizard") {
    if (layout.kind === "tabs") {
      const currentTabId = layout.tabs[activeTabIndex]?.id ?? null;
      return tabId === currentTabId;
    }

    if (layout.kind === "accordion") {
      return tabId !== null && openSectionIds.has(tabId);
    }

    return true;
  }

  const currentStepId = layout.steps[stepIndex]?.id ?? null;
  return stepId === currentStepId;
};
