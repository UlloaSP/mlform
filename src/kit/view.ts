// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { createForm } from "@/runtime";
import type { PresentationRegistry } from "@/presentation";
import { createMlRegistryPack } from "@/builtins-ml";
import { kitErrorMessages } from "./constants";
import {
  cloneSchemaRegistry,
  resolveDesignSystemRegistry,
  resolvePrimitiveRegistry,
} from "./defaults";
import { resolveFormLayout } from "./layout";
import { collectLayoutReferences, flattenLayoutNodes } from "./layout-utils";
import type {
  CreateFormViewOptions,
  FormViewController,
  FormViewSnapshot,
  FormViewState,
} from "./types";
import { buildFormViewSnapshot, createViewState } from "./view-snapshot";
import {
  assertAccordionLayout,
  assertAccordionSection,
  getActiveLayoutNodes,
  validateCurrentWizardStep,
} from "./view-navigation";

type InternalCreateFormViewOptions = CreateFormViewOptions & {
  presentationRegistry?: PresentationRegistry;
  behaviors?: import("@/runtime").RuntimeBehavior[];
};

export const createFormView = (options: InternalCreateFormViewOptions): FormViewController => {
  const defaultPack =
    !options.registry || !options.presentationRegistry || !options.behaviors
      ? createMlRegistryPack()
      : null;
  const engineRegistry = options.registry
    ? cloneSchemaRegistry(options.registry)
    : defaultPack!.registry;
  const presentationRegistry =
    options.presentationRegistry?.clone() ?? defaultPack!.presentationRegistry;
  const primitiveRegistry = resolvePrimitiveRegistry(options.primitiveRegistry);
  const designSystemRegistry = resolveDesignSystemRegistry(options.designSystemRegistry);
  const form = createForm({
    schema: options.schema,
    registry: engineRegistry,
    behaviors: options.behaviors ?? defaultPack?.behaviors,
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
  const getState = (): FormViewState =>
    createViewState(form, resolvedLayout.layout, stepIndex, activeTabIndex, openSectionIds);

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
    cachedSnapshot = buildFormViewSnapshot({
      form,
      presentationRegistry,
      resolvedLayout,
      stepIndex,
      activeTabIndex,
      openSectionIds,
    });
    return cachedSnapshot;
  };

  const notify = (): void => {
    const snapshot = getSnapshot();
    for (const listener of listeners) {
      listener(snapshot);
    }
  };

  form.subscribe(() => {
    notify();
  });

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
      return getActiveLayoutNodes(resolvedLayout, stepIndex, activeTabIndex, openSectionIds);
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

      const valid = await validateCurrentWizardStep(form, resolvedLayout, stepIndex);
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
      assertAccordionSection(resolvedLayout, accordionSections, sectionId);
      if (openSectionIds.has(sectionId)) {
        openSectionIds.delete(sectionId);
      } else {
        openSectionIds.add(sectionId);
      }
      notify();
    },
    openSection(sectionId: string) {
      assertAccordionSection(resolvedLayout, accordionSections, sectionId);
      if (!openSectionIds.has(sectionId)) {
        openSectionIds.add(sectionId);
        notify();
      }
    },
    closeSection(sectionId: string) {
      assertAccordionSection(resolvedLayout, accordionSections, sectionId);
      if (openSectionIds.delete(sectionId)) {
        notify();
      }
    },
    openAllSections() {
      assertAccordionLayout(resolvedLayout);
      openSectionIds = new Set(accordionSections.map((section) => section.id));
      notify();
    },
    closeAllSections() {
      assertAccordionLayout(resolvedLayout);
      openSectionIds = new Set();
      notify();
    },
  } satisfies FormViewController);
};
