// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

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
