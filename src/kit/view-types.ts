// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type {
  DesignSystemConfig,
  DesignSystemRegistry,
  ResolvedDesignSystem,
  AttachedDesignSystem,
} from "@/design-system";
import type { PresentationRegistry } from "@/presentation";
import type {
  ExplanationController,
  ExplanationDescriptor,
  ExplanationStateSnapshot,
  FieldController,
  FieldDescriptor,
  FieldStateSnapshot,
  FormController,
  FormState,
  FormValidationResult,
  Registry,
  ReportController,
  ReportDescriptor,
  ReportStateSnapshot,
  SubmitOptions,
  SubmitResult,
} from "@/runtime";
import type { PrimitiveRegistry, PrimitiveTextOverrides } from "@/primitives";
import type { LayoutReferences } from "./layout-utils";
import type { FormLayoutConfig, ResolvedFormLayout, ResolvedFormLayoutNode } from "./layout-types";
import type { MountFormOptions, KitLabels } from "./mount-types";
import type { PanelState } from "./panel-nav";
import type { WizardLabels, WizardTextOverrides } from "./wizard-constants";

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

export interface FormViewExplanationItem {
  id: string;
  kind: string;
  config: ExplanationController["config"];
  controller: ExplanationController;
  state: ExplanationStateSnapshot;
  descriptor: ExplanationDescriptor | null;
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
  explanations: FormViewExplanationItem[];
  wizard: WizardState | null;
  tabs: TabsState | null;
  accordion: AccordionState | null;
}

export interface CreateFormViewOptions extends Omit<MountFormOptions, "layout"> {
  layout?: FormLayoutConfig;
}

export interface FormViewController {
  readonly form: FormController;
  readonly engineRegistry: Registry;
  readonly presentationRegistry: PresentationRegistry;
  readonly primitiveRegistry: PrimitiveRegistry;
  readonly designSystemRegistry: DesignSystemRegistry;
  readonly state: FormViewState;
  getSnapshot(): FormViewSnapshot;
  getNodeById(id: string): ResolvedFormLayoutNode | undefined;
  getField(id: string): FormViewFieldItem | undefined;
  getReport(id: string): FormViewReportItem | undefined;
  getExplanation(id: string): FormViewExplanationItem | undefined;
  getVisibleFields(): FormViewFieldItem[];
  getVisibleReports(): FormViewReportItem[];
  getVisibleExplanations(): FormViewExplanationItem[];
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

export interface WizardMountUiOptions {
  labels?: WizardLabels;
  text?: WizardTextOverrides;
  primitiveText?: PrimitiveTextOverrides;
  designSystem?: DesignSystemConfig;
  designSystemRegistry?: DesignSystemRegistry;
  onDesignSystemChange?: (resolved: ResolvedDesignSystem) => void;
}

export type MountWizardFormOptions =
  | ({ view: FormViewController } & WizardMountUiOptions)
  | (CreateFormViewOptions &
      WizardMountUiOptions & { layout: import("./layout-types").WizardLayoutConfig });

export interface MountedWizardForm {
  readonly view: FormViewController;
  readonly form: FormController;
  readonly host: HTMLElement;
  readonly designSystem: AttachedDesignSystem;
  unmount(): void;
}

export interface TabsMountUiOptions {
  labels?: KitLabels;
  primitiveText?: PrimitiveTextOverrides;
  designSystem?: DesignSystemConfig;
  designSystemRegistry?: DesignSystemRegistry;
  onDesignSystemChange?: (resolved: ResolvedDesignSystem) => void;
}

export type MountTabsFormOptions =
  | ({ view: FormViewController } & TabsMountUiOptions)
  | (CreateFormViewOptions &
      TabsMountUiOptions & { layout: import("./layout-types").TabsLayoutConfig });

export interface MountedTabsForm {
  readonly view: FormViewController;
  readonly form: FormController;
  readonly host: HTMLElement;
  readonly designSystem: AttachedDesignSystem;
  unmount(): void;
}

export interface AccordionMountUiOptions {
  labels?: KitLabels;
  primitiveText?: PrimitiveTextOverrides;
  designSystem?: DesignSystemConfig;
  designSystemRegistry?: DesignSystemRegistry;
  onDesignSystemChange?: (resolved: ResolvedDesignSystem) => void;
}

export type MountAccordionFormOptions =
  | ({ view: FormViewController } & AccordionMountUiOptions)
  | (CreateFormViewOptions &
      AccordionMountUiOptions & { layout: import("./layout-types").AccordionLayoutConfig });

export interface MountedAccordionForm {
  readonly view: FormViewController;
  readonly form: FormController;
  readonly host: HTMLElement;
  readonly designSystem: AttachedDesignSystem;
  unmount(): void;
}

export type { LayoutReferences, PanelState };
