// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { createForm, executeFormPipeline } from "@/runtime";
import { resolveFormLayout } from "./layout";
import { collectLayoutReferences, flattenLayoutNodes } from "./layout-utils";
import { resolveKitRegistryPack } from "./registry-pack";
import type {
  CreateFormViewOptions,
  FormViewController,
  FormViewSnapshot,
  FormViewState,
  ResolvedFormLayoutNode,
} from "./view-core-types";
import { createFormViewSnapshotCache } from "./view-snapshot-cache";
import { createViewState } from "./view-snapshot";
import { createFormViewNavigation } from "./view-navigation";
import { collectDisclosureSections } from "./view-layout-state";

export const createFormView = (options: CreateFormViewOptions): FormViewController => {
  const registryPack = resolveKitRegistryPack(options);
  const engineRegistry = registryPack.registry;
  const descriptorRegistry = registryPack.descriptorRegistry;
  const form = createForm({
    schema: options.schema,
    registry: engineRegistry,
    behaviors: registryPack.behaviors,
    transport: options.transport,
    initialValues: options.initialValues,
    validators: options.validators,
    hooks: options.hooks,
    hookFailurePolicy: options.hookFailurePolicy,
    inactiveFieldPolicy: options.inactiveFieldPolicy,
    listenerErrorPolicy: options.listenerErrorPolicy,
    onListenerError: options.onListenerError,
  });
  const reportFetchMode = options.reportFetchMode ?? "lazy";
  const resolvedLayout = resolveFormLayout(options.layout, form.fields, form.reports);

  let stepIndex = 0;
  let activeTabIndex = 0;
  const disclosureSections =
    resolvedLayout.layout.kind === "wizard"
      ? resolvedLayout.layout.steps.flatMap((step) => collectDisclosureSections(step.children))
      : resolvedLayout.layout.kind === "tabs"
        ? resolvedLayout.layout.tabs.flatMap((tab) => collectDisclosureSections(tab.children))
        : collectDisclosureSections(resolvedLayout.layout.children);
  let openSectionIds = new Set<string>(
    disclosureSections.filter((section) => section.defaultOpen).map((section) => section.id),
  );
  const listeners = new Set<(snapshot: FormViewSnapshot) => void>();

  const layoutReferences = collectLayoutReferences(resolvedLayout.layout);
  const nodeIndex = new Map<string, ResolvedFormLayoutNode>();
  for (const node of flattenLayoutNodes(resolvedLayout.layout)) {
    if ("id" in node) {
      nodeIndex.set(node.id, node);
    }
  }
  const getState = (): FormViewState =>
    createViewState(form, resolvedLayout.layout, stepIndex, activeTabIndex, openSectionIds);

  const getSnapshot = createFormViewSnapshotCache({
    form,
    descriptorRegistry,
    resolvedLayout,
    getStepIndex: () => stepIndex,
    getActiveTabIndex: () => activeTabIndex,
    getOpenSectionIds: () => openSectionIds,
  });

  const notify = (): void => {
    const snapshot = getSnapshot();
    for (const listener of listeners) {
      listener(snapshot);
    }
  };

  const unsubscribeForm = form.subscribe(() => {
    notify();
  });
  const navigation = createFormViewNavigation({
    form,
    resolvedLayout,
    disclosureSections,
    getStepIndex: () => stepIndex,
    setStepIndex: (index) => {
      stepIndex = index;
    },
    getActiveTabIndex: () => activeTabIndex,
    setActiveTabIndex: (index) => {
      activeTabIndex = index;
    },
    getOpenSectionIds: () => openSectionIds,
    setOpenSectionIds: (sectionIds) => {
      openSectionIds = sectionIds;
    },
    notify,
  });
  let disposed = false;

  return Object.freeze({
    form,
    engineRegistry,
    descriptorRegistry,
    navigation,
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
    getVisibleFields() {
      return getSnapshot().fields.filter((field) => field.visibleInLayout && field.state.visible);
    },
    getVisibleReports() {
      return getSnapshot().reports.filter((report) => report.visibleInLayout);
    },
    getLayoutReferences() {
      return layoutReferences;
    },
    validate() {
      return form.validate();
    },
    async submit(options) {
      if (reportFetchMode === "lazy") {
        return form.submit(options);
      }

      const result = await executeFormPipeline({
        form,
        submit: options,
        reportFetchMode,
      });
      return result.submitResult;
    },
    submitPipeline(options) {
      return executeFormPipeline({
        form,
        submit: options,
        reportFetchMode: reportFetchMode === "lazy" ? "none" : reportFetchMode,
      });
    },
    reset() {
      form.reset();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      unsubscribeForm();
      listeners.clear();
      form.dispose();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  } satisfies FormViewController);
};
