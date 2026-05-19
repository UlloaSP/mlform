// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { FormLayoutNode, ResolvedFormLayoutNode } from "./types";
import {
  assertKnownField,
  assertKnownReport,
  markField,
  markReport,
  nextNodeId,
  type EntityMaps,
  type LayoutReferenceMaps,
} from "./layout-helpers";

export const resolveNodes = (
  nodes: FormLayoutNode[],
  entities: EntityMaps,
  maps: LayoutReferenceMaps,
  nodeIds: Map<string, number>,
  stepId: string | null,
  tabId: string | null,
): ResolvedFormLayoutNode[] => {
  return nodes.map((node) => {
    switch (node.kind) {
      case "section":
        return {
          kind: "section",
          id: nextNodeId("section", node.id ?? node.title, nodeIds),
          title: node.title,
          description: node.description,
          children: resolveNodes(node.children, entities, maps, nodeIds, stepId, tabId),
        };
      case "group":
        return {
          kind: "group",
          id: nextNodeId("group", node.id, nodeIds),
          columns: node.columns,
          children: resolveNodes(node.children, entities, maps, nodeIds, stepId, tabId),
        };
      case "field":
        assertKnownField(node.field, entities);
        markField(node.field, maps, stepId, tabId);
        return { kind: "field", field: node.field };
      case "report":
        assertKnownReport(node.report, entities);
        markReport(node.report, maps, stepId, tabId);
        return { kind: "report", report: node.report };
    }
  });
};
