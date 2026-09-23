// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { FormLayoutNode, ResolvedFormLayoutNode } from "./layout-types";
import { viewErrorMessages } from "./constants";
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
  sectionIds: readonly string[],
): ResolvedFormLayoutNode[] => {
  return nodes.map((node) => {
    switch (node.kind) {
      case "section": {
        if (!node.title?.trim()) throw new TypeError(viewErrorMessages.sectionRequiresTitle);
        const nextSectionId = nextNodeId("section", node.id ?? node.title, nodeIds);
        return {
          kind: "section",
          id: nextSectionId,
          title: node.title,
          description: node.description,
          defaultOpen: node.defaultOpen ?? true,
          children: resolveNodes(node.children, entities, maps, nodeIds, stepId, tabId, [
            ...sectionIds,
            nextSectionId,
          ]),
        };
      }
      case "group":
        return {
          kind: "group",
          id: nextNodeId("group", node.id, nodeIds),
          columns: node.columns,
          children: resolveNodes(node.children, entities, maps, nodeIds, stepId, tabId, sectionIds),
        };
      case "field":
        assertKnownField(node.field, entities);
        markField(node.field, maps, stepId, tabId, sectionIds);
        return { kind: "field", field: node.field };
      case "report":
        assertKnownReport(node.report, entities);
        markReport(node.report, maps, stepId, tabId, sectionIds);
        return { kind: "report", report: node.report };
    }
  });
};
