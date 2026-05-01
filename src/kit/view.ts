// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { createForm } from "@/engine";
import { kitErrorMessages } from "./constants";
import {
  cloneEngineRegistry,
  resolveDesignSystemRegistry,
  resolvePrimitiveRegistry,
} from "./defaults";
import { resolveFormLayout } from "./layout";
import { collectLayoutReferences, flattenLayoutNodes } from "./layout-utils";
import { createIndexedPanelState } from "./panel-nav";
import type {
  AccordionState,
  CreateFormViewOptions,
  FormViewController,
  FormViewExplanationItem,
  FormViewFieldItem,
  FormViewReportItem,
  FormViewSnapshot,
  FormViewState,
  WizardState,
} from "./types";

export const createFormView = (options: CreateFormViewOptions): FormViewController => {
  const engineRegistry = cloneEngineRegistry(options.registry);
  const primitiveRegistry = resolvePrimitiveRegistry(options.primitiveRegistry);
  const designSystemRegistry = resolveDesignSystemRegistry(options.designSystemRegistry);
  const form = createForm({
    schema: options.schema,
    registry: engineRegistry,
    transport: options.transport,
    initialValues: options.initialValues,
    validators: options.validators,
    hooks: options.hooks,
    hookFailurePolicy: options.hookFailurePolicy,
    inactiveFieldPolicy: options.inactiveFieldPolicy,
    listenerErrorPolicy: options.listenerErrorPolicy,
    onListenerError: options.onListenerError,
  });
  const resolvedLayout = resolveFormLayout(
    options.layout,
    form.fields,
    form.reports,
    form.explanations,
  );

  let stepIndex = 0;
  let activeTabIndex = 0;
  let openSectionIds = new Set<string>(
    resolvedLayout.layout.kind === "accordion"
      ? resolvedLayout.layout.sections
          .filter((section) => section.defaultOpen)
          .map((section) => section.id)
      : [],
  );
  let cachedFormState = form.state;
  let cachedStepIndex = -1;
  let cachedActiveTabIndex = -1;
  let cachedOpenSectionKey = "";
  let cachedSnapshot: FormViewSnapshot | null = null;
  const listeners = new Set<(snapshot: FormViewSnapshot) => void>();

  const wizardSteps =
    resolvedLayout.layout.kind === "wizard" ? resolvedLayout.layout.steps : ([] as const);
  const tabs = resolvedLayout.layout.kind === "tabs" ? resolvedLayout.layout.tabs : ([] as const);
  const accordionSections =
    resolvedLayout.layout.kind === "accordion" ? resolvedLayout.layout.sections : ([] as const);
  const layoutReferences = collectLayoutReferences(resolvedLayout.layout);
  const nodeIndex = new Map<
    string,
    (typeof flattenLayoutNodes extends (...args: any[]) => infer R ? R : never)[number]
  >();
  for (const node of flattenLayoutNodes(resolvedLayout.layout)) {
    if ("id" in node) {
      nodeIndex.set(node.id, node);
    }
  }

  const getWizardState = (): WizardState | null => {
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
      canNext: form.state.status !== "validating" && form.state.status !== "submitting",
      canPrev: panel.canGoPrev,
      isLastStep: panel.index === panel.count - 1,
    };
  };

  const getTabsState = () => {
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

  const getAccordionState = (): AccordionState | null => {
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

  const getState = (): FormViewState => ({
    form: form.state,
    wizard: getWizardState(),
    tabs: getTabsState(),
    accordion: getAccordionState(),
  });

  const isVisibleInLayout = (stepId: string | null, tabId: string | null): boolean => {
    if (resolvedLayout.layout.kind !== "wizard") {
      if (resolvedLayout.layout.kind === "tabs") {
        const currentTabId = tabs[activeTabIndex]?.id ?? null;
        return tabId === currentTabId;
      }

      if (resolvedLayout.layout.kind === "accordion") {
        return tabId !== null && openSectionIds.has(tabId);
      }

      return true;
    }

    const currentStepId = wizardSteps[stepIndex]?.id ?? null;
    return stepId === currentStepId;
  };

  const buildSnapshot = (): FormViewSnapshot => {
    const fields = form.fields.map<FormViewFieldItem>((field) => {
      const stepId = resolvedLayout.maps.fieldStepIds.get(field.id) ?? null;
      const tabId = resolvedLayout.maps.fieldTabIds.get(field.id) ?? null;
      return {
        id: field.id,
        kind: field.kind,
        config: field.config,
        controller: field,
        state: field.state,
        descriptor: field.descriptor,
        stepId,
        tabId,
        visibleInLayout: isVisibleInLayout(stepId, tabId),
      };
    });
    const reports = form.reports.map<FormViewReportItem>((report) => {
      const stepId = resolvedLayout.maps.reportStepIds.get(report.id) ?? null;
      const tabId = resolvedLayout.maps.reportTabIds.get(report.id) ?? null;
      return {
        id: report.id,
        kind: report.kind,
        config: report.config,
        controller: report,
        state: report.state,
        descriptor: report.descriptor,
        stepId,
        tabId,
        visibleInLayout: isVisibleInLayout(stepId, tabId),
      };
    });
    const explanations = form.explanations.map<FormViewExplanationItem>((explanation) => {
      const stepId = resolvedLayout.maps.explanationStepIds.get(explanation.id) ?? null;
      const tabId = resolvedLayout.maps.explanationTabIds.get(explanation.id) ?? null;
      return {
        id: explanation.id,
        kind: explanation.kind,
        config: explanation.config,
        controller: explanation,
        state: explanation.state,
        descriptor: explanation.descriptor,
        stepId,
        tabId,
        visibleInLayout: isVisibleInLayout(stepId, tabId),
      };
    });

    return {
      form: form.state,
      layout: resolvedLayout.layout,
      fields,
      reports,
      explanations,
      wizard: getWizardState(),
      tabs: getTabsState(),
      accordion: getAccordionState(),
    };
  };

  const getSnapshot = (): FormViewSnapshot => {
    const currentFormState = form.state;
    const currentOpenSectionKey = Array.from(openSectionIds).sort().join("|");
    if (
      cachedSnapshot &&
      cachedFormState === currentFormState &&
      cachedStepIndex === stepIndex &&
      cachedActiveTabIndex === activeTabIndex &&
      cachedOpenSectionKey === currentOpenSectionKey
    ) {
      return cachedSnapshot;
    }

    cachedFormState = currentFormState;
    cachedStepIndex = stepIndex;
    cachedActiveTabIndex = activeTabIndex;
    cachedOpenSectionKey = currentOpenSectionKey;
    cachedSnapshot = buildSnapshot();
    return cachedSnapshot;
  };

  const notify = (): void => {
    const snapshot = getSnapshot();
    for (const listener of listeners) {
      listener(snapshot);
    }
  };

  const validateCurrentStep = async (): Promise<boolean> => {
    if (resolvedLayout.layout.kind !== "wizard") {
      return false;
    }

    const currentStepId = wizardSteps[stepIndex]?.id;
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

  form.subscribe(() => {
    notify();
  });

  const assertAccordionLayout = (): void => {
    if (resolvedLayout.layout.kind !== "accordion") {
      throw new TypeError(kitErrorMessages.nonAccordionToggleSection);
    }
  };

  const assertKnownAccordionSection = (sectionId: string): void => {
    if (!accordionSections.some((section) => section.id === sectionId)) {
      throw new TypeError(kitErrorMessages.unknownAccordionSection(sectionId));
    }
  };

  return Object.freeze({
    form,
    engineRegistry,
    primitiveRegistry,
    designSystemRegistry,
    get state(): FormViewState {
      return getState();
    },
    getSnapshot,
    getNodeById(id: string) {
      return nodeIndex.get(id);
    },
    getField(id: string) {
      return getSnapshot().fields.find((field) => field.id === id);
    },
    getReport(id: string) {
      return getSnapshot().reports.find((report) => report.id === id);
    },
    getExplanation(id: string) {
      return getSnapshot().explanations.find((explanation) => explanation.id === id);
    },
    getVisibleFields() {
      return getSnapshot().fields.filter((field) => field.visibleInLayout && field.state.visible);
    },
    getVisibleReports() {
      return getSnapshot().reports.filter((report) => report.visibleInLayout);
    },
    getVisibleExplanations() {
      return getSnapshot().explanations.filter((explanation) => explanation.visibleInLayout);
    },
    getActiveLayoutNodes() {
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
    },
    getLayoutReferences() {
      return layoutReferences;
    },
    validate() {
      return form.validate();
    },
    submit(options) {
      return form.submit(options);
    },
    reset() {
      form.reset();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    async nextStep() {
      if (resolvedLayout.layout.kind !== "wizard") {
        return false;
      }

      const valid = await validateCurrentStep();
      if (!valid) {
        return false;
      }

      if (stepIndex < wizardSteps.length - 1) {
        stepIndex += 1;
        notify();
      }

      return true;
    },
    prevStep() {
      if (resolvedLayout.layout.kind !== "wizard") {
        return;
      }

      if (stepIndex > 0) {
        stepIndex -= 1;
        notify();
      }
    },
    async goToStep(stepId: string) {
      if (resolvedLayout.layout.kind !== "wizard") {
        throw new TypeError(kitErrorMessages.nonWizardGoToStep);
      }

      const targetIndex = wizardSteps.findIndex((step) => step.id === stepId);
      if (targetIndex < 0) {
        throw new TypeError(kitErrorMessages.unknownWizardStep(stepId));
      }

      if (targetIndex <= stepIndex) {
        stepIndex = targetIndex;
        notify();
        return true;
      }

      while (stepIndex < targetIndex) {
        const advanced = await this.nextStep();
        if (!advanced) {
          return false;
        }
      }

      return true;
    },
    setActiveTab(tabId: string) {
      if (resolvedLayout.layout.kind !== "tabs") {
        throw new TypeError(kitErrorMessages.nonTabsSetActiveTab);
      }

      const targetIndex = tabs.findIndex((tab) => tab.id === tabId);
      if (targetIndex < 0) {
        throw new TypeError(kitErrorMessages.unknownTab(tabId));
      }

      if (targetIndex !== activeTabIndex) {
        activeTabIndex = targetIndex;
        notify();
      }
    },
    nextTab() {
      if (resolvedLayout.layout.kind !== "tabs") {
        return false;
      }

      if (activeTabIndex >= tabs.length - 1) {
        return false;
      }

      activeTabIndex += 1;
      notify();
      return true;
    },
    prevTab() {
      if (resolvedLayout.layout.kind !== "tabs") {
        return false;
      }

      if (activeTabIndex <= 0) {
        return false;
      }

      activeTabIndex -= 1;
      notify();
      return true;
    },
    toggleSection(sectionId: string) {
      assertAccordionLayout();
      assertKnownAccordionSection(sectionId);
      if (openSectionIds.has(sectionId)) {
        openSectionIds.delete(sectionId);
      } else {
        openSectionIds.add(sectionId);
      }
      notify();
    },
    openSection(sectionId: string) {
      assertAccordionLayout();
      assertKnownAccordionSection(sectionId);
      if (!openSectionIds.has(sectionId)) {
        openSectionIds.add(sectionId);
        notify();
      }
    },
    closeSection(sectionId: string) {
      assertAccordionLayout();
      assertKnownAccordionSection(sectionId);
      if (openSectionIds.delete(sectionId)) {
        notify();
      }
    },
    openAllSections() {
      assertAccordionLayout();
      openSectionIds = new Set(accordionSections.map((section) => section.id));
      notify();
    },
    closeAllSections() {
      assertAccordionLayout();
      openSectionIds = new Set();
      notify();
    },
  } satisfies FormViewController);
};
