// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { FieldDescriptor, PresentationRegistry, ReportDescriptor } from "@/presentation";
import type {
  FieldController,
  FieldStateSnapshot,
  FormController,
  FormHooks,
  FormSchema,
  FormState,
  FormValidationResult,
  FormValidator,
  InactiveFieldPolicy,
  Registry,
  ReportController,
  ReportStateSnapshot,
  RuntimeBehavior,
  SubmitOptions,
  SubmitResult,
  Transport,
} from "@/runtime";
import type { LayoutReferences } from "./layout-utils";
import type { FormLayoutConfig, ResolvedFormLayout, ResolvedFormLayoutNode } from "./layout-types";
import type { PanelState } from "./panel-nav";

export interface WizardState {
  stepIndex: number;
  stepCount: number;
  currentStepId: string;
  canNext: boolean;
  canPrev: boolean;
  isLastStep: boolean;
}

export interface TabsState {
  activeTabIndex: number;
  tabCount: number;
  currentTabId: string;
  canGoNext: boolean;
  canGoPrev: boolean;
}

export interface AccordionState {
  openSectionIds: string[];
  sectionCount: number;
}

export interface FormViewFieldItem {
  id: string;
  kind: string;
  config: FieldController["config"];
  controller: FieldController;
  state: FieldStateSnapshot;
  descriptor: FieldDescriptor;
  stepId: string | null;
  tabId: string | null;
  visibleInLayout: boolean;
}

export interface FormViewReportItem {
  id: string;
  kind: string;
  config: ReportController["config"];
  controller: ReportController;
  state: ReportStateSnapshot;
  descriptor: ReportDescriptor | null;
  stepId: string | null;
  tabId: string | null;
  visibleInLayout: boolean;
}

export interface FormViewState {
  form: FormState;
  wizard: WizardState | null;
  tabs: TabsState | null;
  accordion: AccordionState | null;
}

export interface FormViewSnapshot {
  form: FormState;
  layout: ResolvedFormLayout;
  fields: FormViewFieldItem[];
  reports: FormViewReportItem[];
  wizard: WizardState | null;
  tabs: TabsState | null;
  accordion: AccordionState | null;
}

export interface CreateFormViewOptions {
  schema: FormSchema;
  transport: Transport;
  registry?: Registry;
  presentationRegistry?: PresentationRegistry;
  behaviors?: RuntimeBehavior[];
  initialValues?: Record<string, unknown>;
  validators?: FormValidator[];
  hooks?: FormHooks;
  hookFailurePolicy?: {
    afterSubmit?: "fail-submit" | "preserve-success";
  };
  inactiveFieldPolicy?: InactiveFieldPolicy;
  listenerErrorPolicy?: "ignore" | "throw-aggregate";
  onListenerError?: (error: unknown) => void;
  layout?: FormLayoutConfig;
}

export interface FormViewController {
  readonly form: FormController;
  readonly engineRegistry: Registry;
  readonly presentationRegistry: PresentationRegistry;
  readonly state: FormViewState;
  getSnapshot(): FormViewSnapshot;
  getNodeById(id: string): ResolvedFormLayoutNode | undefined;
  getField(id: string): FormViewFieldItem | undefined;
  getReport(id: string): FormViewReportItem | undefined;
  getVisibleFields(): FormViewFieldItem[];
  getVisibleReports(): FormViewReportItem[];
  getActiveLayoutNodes(): ResolvedFormLayoutNode[];
  getLayoutReferences(): LayoutReferences;
  validate(): Promise<FormValidationResult>;
  submit(options?: SubmitOptions): Promise<SubmitResult>;
  reset(): void;
  subscribe(listener: (snapshot: FormViewSnapshot) => void): () => void;
  nextStep(): Promise<boolean>;
  prevStep(): void;
  goToStep(stepId: string): Promise<boolean>;
  setActiveTab(tabId: string): void;
  nextTab(): boolean;
  prevTab(): boolean;
  toggleSection(sectionId: string): void;
  openSection(sectionId: string): void;
  closeSection(sectionId: string): void;
  openAllSections(): void;
  closeAllSections(): void;
}

export type { LayoutReferences, PanelState, ResolvedFormLayoutNode };
