// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { FieldDescriptor, PrimitiveDescriptorRegistry, ReportDescriptor } from "@/primitives";
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
  PipelineResult,
  SubmitOptions,
  SubmitResult,
  Transport,
} from "@/runtime";
import type { LayoutReferences } from "./layout-utils";
import type { FormLayoutConfig, ResolvedFormLayout, ResolvedFormLayoutNode } from "./layout-types";
import type { PanelState } from "./panel-nav";
import type { ReportFetchMode } from "./report-fetch-mode";
import type { MLFormPlugin } from "./plugin";

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

export interface DisclosureState {
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
  sectionId: string | null;
  sectionIds: readonly string[];
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
  sectionId: string | null;
  sectionIds: readonly string[];
  visibleInLayout: boolean;
}

export interface FormViewState {
  form: FormState;
  wizard: WizardState | null;
  tabs: TabsState | null;
  disclosure: DisclosureState | null;
}

export interface FormViewSnapshot {
  form: FormState;
  layout: ResolvedFormLayout;
  fields: FormViewFieldItem[];
  reports: FormViewReportItem[];
  wizard: WizardState | null;
  tabs: TabsState | null;
  disclosure: DisclosureState | null;
}

export interface CreateFormViewOptions {
  schema: FormSchema;
  transport: Transport;
  registry?: Registry;
  descriptorRegistry?: PrimitiveDescriptorRegistry;
  behaviors?: RuntimeBehavior[];
  plugins?: readonly MLFormPlugin[];
  initialValues?: Record<string, unknown>;
  initialSnapshot?: unknown;
  validators?: FormValidator[];
  hooks?: FormHooks;
  hookFailurePolicy?: {
    afterSubmit?: "fail-submit" | "preserve-success";
  };
  inactiveFieldPolicy?: InactiveFieldPolicy;
  listenerErrorPolicy?: "ignore" | "throw-aggregate";
  onListenerError?: (error: unknown) => void;
  layout?: FormLayoutConfig;
  reportFetchMode?: ReportFetchMode;
}

export interface FormViewDisclosureController {
  toggle(sectionId: string): void;
  open(sectionId: string): void;
  close(sectionId: string): void;
  openAll(): void;
  closeAll(): void;
}

export interface FormViewNavigationController {
  readonly kind: ResolvedFormLayout["kind"];
  readonly disclosure: FormViewDisclosureController;
  getActiveNodes(): ResolvedFormLayoutNode[];
  next(): Promise<boolean>;
  previous(): boolean;
  activate(id: string): Promise<boolean>;
}

export interface FormViewController {
  readonly form: FormController;
  readonly reportFetchMode: ReportFetchMode;
  readonly engineRegistry: Registry;
  readonly descriptorRegistry: PrimitiveDescriptorRegistry;
  readonly navigation: FormViewNavigationController;
  readonly state: FormViewState;
  getSnapshot(): FormViewSnapshot;
  getNodeById(id: string): ResolvedFormLayoutNode | undefined;
  getField(id: string): FormViewFieldItem | undefined;
  getReport(id: string): FormViewReportItem | undefined;
  getVisibleFields(): FormViewFieldItem[];
  getVisibleReports(): FormViewReportItem[];
  getLayoutReferences(): LayoutReferences;
  validate(): Promise<FormValidationResult>;
  submit(options?: SubmitOptions): Promise<SubmitResult>;
  submitPipeline(options?: SubmitOptions): Promise<PipelineResult>;
  reset(): void;
  suspend(reason?: string): void;
  resume(): void;
  dispose(): void;
  subscribe(listener: (snapshot: FormViewSnapshot) => void): () => void;
}

export type { LayoutReferences, PanelState, ResolvedFormLayoutNode };
