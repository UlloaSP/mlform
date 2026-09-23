// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { PrimitiveDescriptorRegistry } from "@/primitives";
import type { FieldDescriptor } from "@/primitives";
import type {
  FieldController,
  FieldStateSnapshot,
  FormController,
  FormState,
  ReportController,
  ReportStateSnapshot,
} from "@/runtime";
import type { FormViewFieldItem, FormViewReportItem, FormViewSnapshot } from "./view-core-types";
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
  state: FieldStateSnapshot,
  descriptorRegistry: PrimitiveDescriptorRegistry,
  resolvedLayout: ResolvedLayoutResult,
  stepIndex: number,
  activeTabIndex: number,
  openSectionIds: Set<string>,
): FormViewFieldItem => {
  const stepId = resolvedLayout.maps.fieldStepIds.get(field.id) ?? null;
  const tabId = resolvedLayout.maps.fieldTabIds.get(field.id) ?? null;
  const sectionIds = resolvedLayout.maps.fieldSectionIds.get(field.id) ?? [];
  const sectionId = sectionIds.at(-1) ?? null;
  const presenter = descriptorRegistry.getField(field.kind);

  return {
    id: field.id,
    kind: field.kind,
    config: field.config,
    controller: field,
    state,
    descriptor:
      presenter?.describe(field.config, {
        fieldId: field.id,
        state,
        value: state.value,
      }) ?? fallbackFieldDescriptor(field),
    stepId,
    tabId,
    sectionId,
    sectionIds,
    visibleInLayout: isVisibleInLayout(
      resolvedLayout.layout,
      stepIndex,
      activeTabIndex,
      openSectionIds,
      stepId,
      tabId,
      sectionIds,
    ),
  };
};

const buildReportItem = (
  report: ReportController,
  state: ReportStateSnapshot,
  formState: FormState,
  descriptorRegistry: PrimitiveDescriptorRegistry,
  resolvedLayout: ResolvedLayoutResult,
  stepIndex: number,
  activeTabIndex: number,
  openSectionIds: Set<string>,
): FormViewReportItem => {
  const stepId = resolvedLayout.maps.reportStepIds.get(report.id) ?? null;
  const tabId = resolvedLayout.maps.reportTabIds.get(report.id) ?? null;
  const sectionIds = resolvedLayout.maps.reportSectionIds.get(report.id) ?? [];
  const sectionId = sectionIds.at(-1) ?? null;
  const presenter = descriptorRegistry.getReport(report.kind);

  return {
    id: report.id,
    kind: report.kind,
    config: report.config,
    controller: report,
    state,
    descriptor: presenter
      ? presenter.describe(report.config, {
          reportId: report.id,
          state,
          payload: state.payload,
          result: formState.lastResult,
        })
      : null,
    stepId,
    tabId,
    sectionId,
    sectionIds,
    visibleInLayout: isVisibleInLayout(
      resolvedLayout.layout,
      stepIndex,
      activeTabIndex,
      openSectionIds,
      stepId,
      tabId,
      sectionIds,
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
}: BuildSnapshotOptions): FormViewSnapshot => {
  const formState = form.state;
  return {
    form: formState,
    layout: resolvedLayout.layout,
    fields: form.fields.map((field) =>
      buildFieldItem(
        field,
        field.state,
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
        report.state,
        formState,
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
      formState,
    }),
    tabs: getTabsState({
      layout: resolvedLayout.layout,
      stepIndex,
      activeTabIndex,
      openSectionIds,
      formState,
    }),
    disclosure: getDisclosureState({
      layout: resolvedLayout.layout,
      stepIndex,
      activeTabIndex,
      openSectionIds,
      formState,
    }),
  };
};

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
