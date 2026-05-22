// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { FieldController, ReportController } from "@/runtime";
import { kitErrorMessages } from "./constants";
import {
  assertAllFieldsCovered,
  createDefaultSinglePageNodes,
  createEntityMaps,
  createReferenceMaps,
  nextNodeId,
  type LayoutReferenceMaps,
} from "./layout-helpers";
import { resolveNodes } from "./layout-node-resolver";
import type { FormLayoutConfig, ResolvedFormLayout } from "./types";

export interface ResolvedLayoutResult {
  layout: ResolvedFormLayout;
  maps: LayoutReferenceMaps;
}

export const resolveFormLayout = (
  layout: FormLayoutConfig | undefined,
  fields: readonly FieldController[],
  reports: readonly ReportController[],
): ResolvedLayoutResult => {
  const entities = createEntityMaps(fields, reports);
  const maps = createReferenceMaps();
  const nodeIds = new Map<string, number>();

  if (
    !layout ||
    layout.kind === undefined ||
    layout.kind === "stacked" ||
    layout.kind === "split"
  ) {
    const children = resolveNodes(
      layout?.children ?? createDefaultSinglePageNodes(fields, reports),
      entities,
      maps,
      nodeIds,
      null,
      null,
      null,
    );
    assertAllFieldsCovered(fields, maps);
    return {
      layout: {
        kind: layout?.kind ?? "stacked",
        children,
      },
      maps,
    };
  }

  if (layout.kind === "tabs") {
    if (layout.tabs.length === 0) {
      throw new TypeError(kitErrorMessages.tabsRequiresTabs);
    }

    const tabIds = new Map<string, number>();
    const tabs = layout.tabs.map((tab, index) => {
      const tabId = nextNodeId("tab", tab.id ?? tab.title ?? `tab-${index + 1}`, tabIds);
      const children = resolveNodes(tab.children, entities, maps, nodeIds, null, tabId, null);
      if (children.length === 0) {
        throw new TypeError(kitErrorMessages.tabEmpty(tabId));
      }

      return {
        id: tabId,
        title: tab.title,
        description: tab.description,
        children,
      };
    });

    assertAllFieldsCovered(fields, maps);

    return {
      layout: {
        kind: "tabs",
        tabs,
      },
      maps,
    };
  }

  const wizardLayout = layout as Extract<FormLayoutConfig, { kind: "wizard" }>;

  if (wizardLayout.steps.length === 0) {
    throw new TypeError(kitErrorMessages.wizardRequiresSteps);
  }

  const stepIds = new Map<string, number>();
  const steps = wizardLayout.steps.map(
    (step: (typeof wizardLayout.steps)[number], index: number) => {
      const stepId = nextNodeId("step", step.id ?? step.title ?? `step-${index + 1}`, stepIds);
      const children = resolveNodes(step.children, entities, maps, nodeIds, stepId, null, null);
      if (children.length === 0) {
        throw new TypeError(kitErrorMessages.wizardStepEmpty(stepId));
      }

      return {
        id: stepId,
        title: step.title,
        description: step.description,
        children,
      };
    },
  );

  assertAllFieldsCovered(fields, maps);

  return {
    layout: {
      kind: "wizard",
      steps,
    },
    maps,
  };
};
