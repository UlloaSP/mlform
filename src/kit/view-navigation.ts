// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { FormController } from "@/runtime";
import { kitErrorMessages } from "./constants";
import type { ResolvedLayoutResult } from "./layout";
import type { FormViewNavigationController, ResolvedFormLayoutNode } from "./types";

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

interface CreateFormViewNavigationOptions {
  form: FormController;
  resolvedLayout: ResolvedLayoutResult;
  disclosureSections: readonly { id: string }[];
  getStepIndex: () => number;
  setStepIndex: (index: number) => void;
  getActiveTabIndex: () => number;
  setActiveTabIndex: (index: number) => void;
  getOpenSectionIds: () => Set<string>;
  setOpenSectionIds: (sectionIds: Set<string>) => void;
  notify: () => void;
}

export const createFormViewNavigation = ({
  form,
  resolvedLayout,
  disclosureSections,
  getStepIndex,
  setStepIndex,
  getActiveTabIndex,
  setActiveTabIndex,
  getOpenSectionIds,
  setOpenSectionIds,
  notify,
}: CreateFormViewNavigationOptions): FormViewNavigationController => {
  const layout = resolvedLayout.layout;
  const wizardSteps = layout.kind === "wizard" ? layout.steps : [];
  const tabs = layout.kind === "tabs" ? layout.tabs : [];

  const nextWizardStep = async (): Promise<boolean> => {
    const stepIndex = getStepIndex();
    if (!(await validateCurrentWizardStep(form, resolvedLayout, stepIndex))) return false;
    if (stepIndex < wizardSteps.length - 1) {
      setStepIndex(stepIndex + 1);
      notify();
    }
    return true;
  };

  const activateWizardStep = async (stepId: string): Promise<boolean> => {
    const targetIndex = wizardSteps.findIndex((step) => step.id === stepId);
    if (targetIndex < 0) throw new TypeError(kitErrorMessages.unknownWizardStep(stepId));
    if (targetIndex <= getStepIndex()) {
      setStepIndex(targetIndex);
      notify();
      return true;
    }
    while (getStepIndex() < targetIndex) {
      if (!(await nextWizardStep())) return false;
    }
    return true;
  };

  const activateTab = (tabId: string): boolean => {
    const targetIndex = tabs.findIndex((tab) => tab.id === tabId);
    if (targetIndex < 0) throw new TypeError(kitErrorMessages.unknownTab(tabId));
    if (targetIndex === getActiveTabIndex()) return false;
    setActiveTabIndex(targetIndex);
    notify();
    return true;
  };

  return Object.freeze({
    kind: layout.kind,
    getActiveNodes: () =>
      getActiveLayoutNodes(
        resolvedLayout,
        getStepIndex(),
        getActiveTabIndex(),
        getOpenSectionIds(),
      ),
    async next() {
      if (layout.kind === "wizard") return nextWizardStep();
      if (layout.kind !== "tabs" || getActiveTabIndex() >= tabs.length - 1) return false;
      setActiveTabIndex(getActiveTabIndex() + 1);
      notify();
      return true;
    },
    previous() {
      if (layout.kind === "wizard") {
        if (getStepIndex() <= 0) return false;
        setStepIndex(getStepIndex() - 1);
      } else if (layout.kind === "tabs") {
        if (getActiveTabIndex() <= 0) return false;
        setActiveTabIndex(getActiveTabIndex() - 1);
      } else {
        return false;
      }
      notify();
      return true;
    },
    async activate(id: string) {
      if (layout.kind === "wizard") return activateWizardStep(id);
      if (layout.kind === "tabs") return activateTab(id);
      return false;
    },
    disclosure: Object.freeze({
      toggle(sectionId: string) {
        assertDisclosureSection(disclosureSections, sectionId);
        const next = new Set(getOpenSectionIds());
        if (next.has(sectionId)) next.delete(sectionId);
        else next.add(sectionId);
        setOpenSectionIds(next);
        notify();
      },
      open(sectionId: string) {
        assertDisclosureSection(disclosureSections, sectionId);
        if (getOpenSectionIds().has(sectionId)) return;
        setOpenSectionIds(new Set([...getOpenSectionIds(), sectionId]));
        notify();
      },
      close(sectionId: string) {
        assertDisclosureSection(disclosureSections, sectionId);
        if (!getOpenSectionIds().has(sectionId)) return;
        const next = new Set(getOpenSectionIds());
        next.delete(sectionId);
        setOpenSectionIds(next);
        notify();
      },
      openAll() {
        setOpenSectionIds(new Set(disclosureSections.map((section) => section.id)));
        notify();
      },
      closeAll() {
        setOpenSectionIds(new Set());
        notify();
      },
    }),
  });
};
