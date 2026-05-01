// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type {
  AttachedDesignSystem,
  DesignSystemConfig,
  DesignSystemRegistry,
  ResolvedDesignSystem,
} from "@/design-system";
import type {
  FormController,
  FormHooks,
  FormSchema,
  FormState,
  FormValidationResult,
  FormValidator,
  InactiveFieldPolicy,
  Registry,
  SubmitOptions,
  SubmitResult,
  Transport,
  ExplanationController,
  ExplanationDescriptor,
  ExplanationStateSnapshot,
  FieldController,
  FieldDescriptor,
  FieldStateSnapshot,
  ReportController,
  ReportDescriptor,
  ReportStateSnapshot,
} from "@/engine";
import type {
  PrimitiveContainerStrategy,
  PrimitiveLayout,
  PrimitiveRegistry,
  PrimitiveReportTransport,
  PrimitiveTextOverrides,
} from "@/primitives";
import type { LayoutReferences } from "./layout-utils";
import type { PanelState } from "./panel-nav";
import type { WizardLabels, WizardTextOverrides } from "./wizard-constants";

export type {
  ApiKeyAuthOptions,
  AuthOptions,
  BearerAuthOptions,
  CacheOptions,
  CapabilityRequirement,
  CircuitBreakerOptions,
  CircuitBreakerSharedState,
  CircuitBreakerStateSnapshot,
  CustomAuthOptions,
  DedupOptions,
  FanoutTransportFailure,
  FanoutTransportOptions,
  FanoutTransportResult,
  FallbackTransportFailure,
  FallbackTransportOptions,
  GraphqlTransportOptions,
  GrpcSessionTransportOptions,
  GrpcStreamTransportOptions,
  GrpcTransportOptions,
  GrpcUnaryTransportOptions,
  HedgedTransportOptions,
  JsonTransportMethod,
  JsonTransportOptions,
  LoadBalancingTransportOptions,
  PipelineStage,
  PipelineTransportOptions,
  QuorumFanoutTransportOptions,
  RateLimitLeaseRequest,
  RateLimitOptions,
  RacingTransportOptions,
  RetryOptions,
  RoutingTransportOptions,
  SessionTransportOptions,
  SharedRateLimiter,
  SharedRateLimiterLease,
  SseTransportOptions,
  TransportCacheEntry,
  TransportCacheStore,
  TransportCollection,
  TransportContextAuthOptions,
  TransportHealthSnapshot,
  TransportHealthState,
  TransportLogOptions,
  TransportMetricsOptions,
  TransportMiddleware,
  TransportTelemetryEvent,
  TransportTraceOptions,
  WebSocketSessionTransportOptions,
  WeightedRoutingTransportOptions,
} from "@/transport";

export interface KitDesignSystemSnapshot extends Omit<
  DesignSystemConfig,
  "mode" | "theme" | "recipe"
> {
  mode: NonNullable<DesignSystemConfig["mode"]>;
  theme: NonNullable<DesignSystemConfig["theme"]>;
  recipe: NonNullable<DesignSystemConfig["recipe"]>;
}

export interface KitLabels {
  form?: string;
  reports?: string;
  submit?: string;
  validating?: string;
  submitting?: string;
}

export interface MountFormOptions {
  schema: FormSchema;
  transport: Transport;
  registry?: Registry;
  primitiveRegistry?: PrimitiveRegistry;
  designSystemRegistry?: DesignSystemRegistry;
  designSystem?: DesignSystemConfig;
  initialValues?: Record<string, unknown>;
  validators?: FormValidator[];
  hooks?: FormHooks;
  hookFailurePolicy?: {
    afterSubmit?: "fail-submit" | "preserve-success";
  };
  inactiveFieldPolicy?: InactiveFieldPolicy;
  listenerErrorPolicy?: "ignore" | "throw-aggregate";
  onListenerError?: (error: unknown) => void;
  layout?: PrimitiveLayout;
  containerStrategy?: PrimitiveContainerStrategy;
  reportPane?: "auto" | "always" | "hidden";
  reportTransport?: PrimitiveReportTransport;
  labels?: KitLabels;
  primitiveText?: PrimitiveTextOverrides;
  onDesignSystemChange?: (resolved: ResolvedDesignSystem) => void;
}

export interface MountedForm {
  readonly form: FormController;
  readonly host: HTMLElement;
  readonly engineRegistry: Registry;
  readonly primitiveRegistry: PrimitiveRegistry;
  readonly designSystemRegistry: DesignSystemRegistry;
  readonly designSystem: AttachedDesignSystem;
  updateDesignSystem(config: DesignSystemConfig): void;
  replaceDesignSystem(config: KitDesignSystemSnapshot): void;
  resetDesignSystem(): void;
  unmount(): void;
}

export interface FormLayoutSectionNode {
  kind: "section";
  id?: string;
  title?: string;
  description?: string;
  children: FormLayoutNode[];
}

export interface FormLayoutGroupNode {
  kind: "group";
  id?: string;
  columns?: 1 | 2 | 3;
  children: FormLayoutNode[];
}

export interface FormLayoutFieldNode {
  kind: "field";
  field: string;
}

export interface FormLayoutReportNode {
  kind: "report";
  report: string;
}

export interface FormLayoutExplanationNode {
  kind: "explanation";
  explanation: string;
}

export type FormLayoutNode =
  | FormLayoutSectionNode
  | FormLayoutGroupNode
  | FormLayoutFieldNode
  | FormLayoutReportNode
  | FormLayoutExplanationNode;

export interface SinglePageLayoutConfig {
  kind?: "single-page";
  children?: FormLayoutNode[];
}

export interface WizardStepConfig {
  id?: string;
  title: string;
  description?: string;
  children: FormLayoutNode[];
}

export interface WizardLayoutConfig {
  kind: "wizard";
  steps: WizardStepConfig[];
}

export interface TabLayoutConfig {
  id?: string;
  title: string;
  description?: string;
  children: FormLayoutNode[];
}

export interface TabsLayoutConfig {
  kind: "tabs";
  tabs: TabLayoutConfig[];
}

export interface AccordionSectionConfig {
  id?: string;
  title: string;
  description?: string;
  children: FormLayoutNode[];
  defaultOpen?: boolean;
}

export interface AccordionLayoutConfig {
  kind: "accordion";
  sections: AccordionSectionConfig[];
}

export type FormLayoutConfig =
  | SinglePageLayoutConfig
  | WizardLayoutConfig
  | TabsLayoutConfig
  | AccordionLayoutConfig;

export interface ResolvedFormLayoutSectionNode {
  kind: "section";
  id: string;
  title?: string;
  description?: string;
  children: ResolvedFormLayoutNode[];
}

export interface ResolvedFormLayoutGroupNode {
  kind: "group";
  id: string;
  columns?: 1 | 2 | 3;
  children: ResolvedFormLayoutNode[];
}

export interface ResolvedFormLayoutFieldNode {
  kind: "field";
  field: string;
}

export interface ResolvedFormLayoutReportNode {
  kind: "report";
  report: string;
}

export interface ResolvedFormLayoutExplanationNode {
  kind: "explanation";
  explanation: string;
}

export type ResolvedFormLayoutNode =
  | ResolvedFormLayoutSectionNode
  | ResolvedFormLayoutGroupNode
  | ResolvedFormLayoutFieldNode
  | ResolvedFormLayoutReportNode
  | ResolvedFormLayoutExplanationNode;

export interface ResolvedSinglePageLayout {
  kind: "single-page";
  children: ResolvedFormLayoutNode[];
}

export interface ResolvedWizardStep {
  id: string;
  title: string;
  description?: string;
  children: ResolvedFormLayoutNode[];
}

export interface ResolvedWizardLayout {
  kind: "wizard";
  steps: ResolvedWizardStep[];
}

export interface ResolvedTabLayout {
  id: string;
  title: string;
  description?: string;
  children: ResolvedFormLayoutNode[];
}

export interface ResolvedTabsLayout {
  kind: "tabs";
  tabs: ResolvedTabLayout[];
}

export interface ResolvedAccordionSection {
  id: string;
  title: string;
  description?: string;
  defaultOpen: boolean;
  children: ResolvedFormLayoutNode[];
}

export interface ResolvedAccordionLayout {
  kind: "accordion";
  sections: ResolvedAccordionSection[];
}

export type ResolvedFormLayout =
  | ResolvedSinglePageLayout
  | ResolvedWizardLayout
  | ResolvedTabsLayout
  | ResolvedAccordionLayout;

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
  | (CreateFormViewOptions & WizardMountUiOptions & { layout: WizardLayoutConfig });

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
  | (CreateFormViewOptions & TabsMountUiOptions & { layout: TabsLayoutConfig });

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
  | (CreateFormViewOptions & AccordionMountUiOptions & { layout: AccordionLayoutConfig });

export interface MountedAccordionForm {
  readonly view: FormViewController;
  readonly form: FormController;
  readonly host: HTMLElement;
  readonly designSystem: AttachedDesignSystem;
  unmount(): void;
}

export type { LayoutReferences, PanelState };
