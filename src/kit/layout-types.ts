// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

export interface FormLayoutSectionNode {
  kind: "section";
  id?: string;
  title?: string;
  description?: string;
  defaultOpen?: boolean;
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

export type FormLayoutNode =
  | FormLayoutSectionNode
  | FormLayoutGroupNode
  | FormLayoutFieldNode
  | FormLayoutReportNode;

export interface SinglePageLayoutConfig {
  kind?: "stacked" | "split";
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

export type FormLayoutConfig = SinglePageLayoutConfig | WizardLayoutConfig | TabsLayoutConfig;

export interface ResolvedFormLayoutSectionNode {
  kind: "section";
  id: string;
  title?: string;
  description?: string;
  defaultOpen: boolean;
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

export type ResolvedFormLayoutNode =
  | ResolvedFormLayoutSectionNode
  | ResolvedFormLayoutGroupNode
  | ResolvedFormLayoutFieldNode
  | ResolvedFormLayoutReportNode;

export interface ResolvedSinglePageLayout {
  kind: "stacked" | "split";
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

export type ResolvedFormLayout =
  | ResolvedSinglePageLayout
  | ResolvedWizardLayout
  | ResolvedTabsLayout;
