// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { PrimitiveDescriptorRegistry } from "@/primitives";
import type { FieldDescriptor } from "@/primitives";
import type { FieldController, FormController, ReportController } from "@/runtime";
import type { FormViewFieldItem, FormViewReportItem, FormViewSnapshot } from "./types";
import {
  createFormViewState,
  getDisclosureState,
  getTabsState,
  getWizardState,
  isVisibleInLayout,
} from "./view-layout-state";
import type { ResolvedLayoutResult } from "./layout";

type BuildSnapshotOptions = {
  form: FormController;
  descriptorRegistry: PrimitiveDescriptorRegistry;
  resolvedLayout: ResolvedLayoutResult;
  stepIndex: number;
  activeTabIndex: number;
  openSectionIds: Set<string>;
};

const fallbackFieldDescriptor = (field: FieldController): FieldDescriptor => ({
  component: "unsupported-field",
  props: { label: field.config.label ?? field.id },
});

const buildFieldItem = (
  field: FieldController,
  descriptorRegistry: PrimitiveDescriptorRegistry,
  resolvedLayout: ResolvedLayoutResult,
  stepIndex: number,
  activeTabIndex: number,
  openSectionIds: Set<string>,
): FormViewFieldItem => {
  const stepId = resolvedLayout.maps.fieldStepIds.get(field.id) ?? null;
  const tabId = resolvedLayout.maps.fieldTabIds.get(field.id) ?? null;
  const sectionId = resolvedLayout.maps.fieldSectionIds.get(field.id) ?? null;
  const presenter = descriptorRegistry.getField(field.kind);

  return {
    id: field.id,
    kind: field.kind,
    config: field.config,
    controller: field,
    state: field.state,
    descriptor:
      presenter?.describe(field.config, {
        fieldId: field.id,
        state: field.state,
        value: field.state.value,
      }) ?? fallbackFieldDescriptor(field),
    stepId,
    tabId,
    sectionId,
    visibleInLayout: isVisibleInLayout(
      resolvedLayout.layout,
      stepIndex,
      activeTabIndex,
      openSectionIds,
      stepId,
      tabId,
      sectionId,
    ),
  };
};

const buildReportItem = (
  report: ReportController,
  form: FormController,
  descriptorRegistry: PrimitiveDescriptorRegistry,
  resolvedLayout: ResolvedLayoutResult,
  stepIndex: number,
  activeTabIndex: number,
  openSectionIds: Set<string>,
): FormViewReportItem => {
  const stepId = resolvedLayout.maps.reportStepIds.get(report.id) ?? null;
  const tabId = resolvedLayout.maps.reportTabIds.get(report.id) ?? null;
  const sectionId = resolvedLayout.maps.reportSectionIds.get(report.id) ?? null;
  const presenter = descriptorRegistry.getReport(report.kind);

  return {
    id: report.id,
    kind: report.kind,
    config: report.config,
    controller: report,
    state: report.state,
    descriptor: presenter
      ? presenter.describe(report.config, {
          reportId: report.id,
          state: report.state,
          payload: report.state.payload,
          result: form.state.lastResult,
        })
      : null,
    stepId,
    tabId,
    sectionId,
    visibleInLayout: isVisibleInLayout(
      resolvedLayout.layout,
      stepIndex,
      activeTabIndex,
      openSectionIds,
      stepId,
      tabId,
      sectionId,
    ),
  };
};

export const buildFormViewSnapshot = ({
  form,
  descriptorRegistry,
  resolvedLayout,
  stepIndex,
  activeTabIndex,
  openSectionIds,
}: BuildSnapshotOptions): FormViewSnapshot => ({
  form: form.state,
  layout: resolvedLayout.layout,
  fields: form.fields.map((field) =>
    buildFieldItem(
      field,
      descriptorRegistry,
      resolvedLayout,
      stepIndex,
      activeTabIndex,
      openSectionIds,
    ),
  ),
  reports: form.reports.map((report) =>
    buildReportItem(
      report,
      form,
      descriptorRegistry,
      resolvedLayout,
      stepIndex,
      activeTabIndex,
      openSectionIds,
    ),
  ),
  wizard: getWizardState({
    layout: resolvedLayout.layout,
    stepIndex,
    activeTabIndex,
    openSectionIds,
    formState: form.state,
  }),
  tabs: getTabsState({
    layout: resolvedLayout.layout,
    stepIndex,
    activeTabIndex,
    openSectionIds,
    formState: form.state,
  }),
  disclosure: getDisclosureState({
    layout: resolvedLayout.layout,
    stepIndex,
    activeTabIndex,
    openSectionIds,
    formState: form.state,
  }),
});

export const createViewState = (
  form: FormController,
  layout: ResolvedLayoutResult["layout"],
  stepIndex: number,
  activeTabIndex: number,
  openSectionIds: Set<string>,
) =>
  createFormViewState({
    formState: form.state,
    layout,
    stepIndex,
    activeTabIndex,
    openSectionIds,
  });
