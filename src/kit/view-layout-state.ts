// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { createIndexedPanelState } from "./panel-nav";
import type {
  DisclosureState,
  FormViewState,
  ResolvedFormLayoutNode,
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

export const collectDisclosureSections = (
  nodes: readonly ResolvedFormLayoutNode[],
  sections: { id: string; defaultOpen: boolean }[] = [],
): { id: string; defaultOpen: boolean }[] => {
  for (const node of nodes) {
    if (node.kind === "section") {
      sections.push({ id: node.id, defaultOpen: node.defaultOpen });
      collectDisclosureSections(node.children, sections);
    } else if (node.kind === "group") {
      collectDisclosureSections(node.children, sections);
    }
  }
  return sections;
};

export const getDisclosureState = ({
  layout,
  openSectionIds,
}: LayoutStateOptions): DisclosureState | null => {
  const disclosureSections =
    layout.kind === "wizard"
      ? layout.steps.flatMap((step) => collectDisclosureSections(step.children))
      : layout.kind === "tabs"
        ? layout.tabs.flatMap((tab) => collectDisclosureSections(tab.children))
        : collectDisclosureSections(layout.children);
  if (disclosureSections.length === 0) {
    return null;
  }

  return {
    openSectionIds: disclosureSections
      .map((section) => section.id)
      .filter((sectionId) => openSectionIds.has(sectionId)),
    sectionCount: disclosureSections.length,
  };
};

export const createFormViewState = (options: LayoutStateOptions): FormViewState => ({
  form: options.formState,
  wizard: getWizardState(options),
  tabs: getTabsState(options),
  disclosure: getDisclosureState(options),
});

export const isVisibleInLayout = (
  layout: ResolvedFormLayout,
  stepIndex: number,
  activeTabIndex: number,
  openSectionIds: Set<string>,
  stepId: string | null,
  tabId: string | null,
  sectionId: string | null,
): boolean => {
  if (layout.kind !== "wizard") {
    if (layout.kind === "tabs") {
      const currentTabId = layout.tabs[activeTabIndex]?.id ?? null;
      return tabId === currentTabId && (!sectionId || openSectionIds.has(sectionId));
    }

    return !sectionId || openSectionIds.has(sectionId);
  }

  const currentStepId = layout.steps[stepIndex]?.id ?? null;
  return stepId === currentStepId && (!sectionId || openSectionIds.has(sectionId));
};
