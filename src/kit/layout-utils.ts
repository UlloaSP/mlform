// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { ResolvedFormLayout, ResolvedFormLayoutNode } from "./types";

export interface LayoutReferences {
  fields: string[];
  reports: string[];
}

const walkNode = (
  node: ResolvedFormLayoutNode,
  visitor: (node: ResolvedFormLayoutNode) => void,
): void => {
  visitor(node);
  if ("children" in node) {
    for (const child of node.children) {
      walkNode(child, visitor);
    }
  }
};

export const walkLayoutNodes = (
  layout: ResolvedFormLayout,
  visitor: (node: ResolvedFormLayoutNode) => void,
): void => {
  switch (layout.kind) {
    case "single-page":
      for (const node of layout.children) {
        walkNode(node, visitor);
      }
      return;
    case "wizard":
      for (const step of layout.steps) {
        for (const node of step.children) {
          walkNode(node, visitor);
        }
      }
      return;
    case "tabs":
      for (const tab of layout.tabs) {
        for (const node of tab.children) {
          walkNode(node, visitor);
        }
      }
      return;
    case "accordion":
      for (const section of layout.sections) {
        for (const node of section.children) {
          walkNode(node, visitor);
        }
      }
  }
};

export const flattenLayoutNodes = (layout: ResolvedFormLayout): ResolvedFormLayoutNode[] => {
  const nodes: ResolvedFormLayoutNode[] = [];
  walkLayoutNodes(layout, (node) => {
    nodes.push(node);
  });
  return nodes;
};

export const collectLayoutReferences = (layout: ResolvedFormLayout): LayoutReferences => {
  const references: LayoutReferences = {
    fields: [],
    reports: [],
  };

  for (const node of flattenLayoutNodes(layout)) {
    switch (node.kind) {
      case "field":
        references.fields.push(node.field);
        break;
      case "report":
        references.reports.push(node.report);
        break;
      default:
        break;
    }
  }

  return references;
};
