// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { ExplanationController, FieldController, ReportController } from "@/engine";
import { slugify } from "@/engine/utils";
import { kitErrorMessages } from "./constants";
import type {
  FormLayoutConfig,
  FormLayoutNode,
  ResolvedFormLayout,
  ResolvedFormLayoutNode,
} from "./types";

type LayoutReferenceMaps = {
  fieldStepIds: Map<string, string>;
  reportStepIds: Map<string, string>;
  explanationStepIds: Map<string, string>;
  fieldTabIds: Map<string, string>;
  reportTabIds: Map<string, string>;
  explanationTabIds: Map<string, string>;
  fieldIdsInLayout: Set<string>;
  reportIdsInLayout: Set<string>;
  explanationIdsInLayout: Set<string>;
};

export interface ResolvedLayoutResult {
  layout: ResolvedFormLayout;
  maps: LayoutReferenceMaps;
}

type EntityMaps = {
  fieldIds: Set<string>;
  reportIds: Set<string>;
  explanationIds: Set<string>;
};

const createEntityMaps = (
  fields: readonly FieldController[],
  reports: readonly ReportController[],
  explanations: readonly ExplanationController[],
): EntityMaps => ({
  fieldIds: new Set(fields.map((field) => field.id)),
  reportIds: new Set(reports.map((report) => report.id)),
  explanationIds: new Set(explanations.map((explanation) => explanation.id)),
});

const createReferenceMaps = (): LayoutReferenceMaps => ({
  fieldStepIds: new Map(),
  reportStepIds: new Map(),
  explanationStepIds: new Map(),
  fieldTabIds: new Map(),
  reportTabIds: new Map(),
  explanationTabIds: new Map(),
  fieldIdsInLayout: new Set(),
  reportIdsInLayout: new Set(),
  explanationIdsInLayout: new Set(),
});

const nextNodeId = (
  prefix: string,
  preferred: string | undefined,
  counts: Map<string, number>,
): string => {
  const base = slugify(preferred ?? prefix) || prefix;
  const current = counts.get(base) ?? 0;
  counts.set(base, current + 1);
  return current === 0 ? base : `${base}-${current + 1}`;
};

const assertKnownField = (fieldId: string, entities: EntityMaps): void => {
  if (!entities.fieldIds.has(fieldId)) {
    throw new TypeError(kitErrorMessages.unknownFieldReference(fieldId));
  }
};

const assertKnownReport = (reportId: string, entities: EntityMaps): void => {
  if (!entities.reportIds.has(reportId)) {
    throw new TypeError(kitErrorMessages.unknownReportReference(reportId));
  }
};

const assertKnownExplanation = (explanationId: string, entities: EntityMaps): void => {
  if (!entities.explanationIds.has(explanationId)) {
    throw new TypeError(kitErrorMessages.unknownExplanationReference(explanationId));
  }
};

const markField = (
  fieldId: string,
  maps: LayoutReferenceMaps,
  stepId: string | null,
  tabId: string | null,
): void => {
  if (maps.fieldIdsInLayout.has(fieldId)) {
    throw new TypeError(kitErrorMessages.fieldDuplicateInLayout(fieldId));
  }

  maps.fieldIdsInLayout.add(fieldId);
  if (stepId) {
    maps.fieldStepIds.set(fieldId, stepId);
  }
  if (tabId) {
    maps.fieldTabIds.set(fieldId, tabId);
  }
};

const markReport = (
  reportId: string,
  maps: LayoutReferenceMaps,
  stepId: string | null,
  tabId: string | null,
): void => {
  if (maps.reportIdsInLayout.has(reportId)) {
    throw new TypeError(kitErrorMessages.reportDuplicateInLayout(reportId));
  }

  maps.reportIdsInLayout.add(reportId);
  if (stepId) {
    maps.reportStepIds.set(reportId, stepId);
  }
  if (tabId) {
    maps.reportTabIds.set(reportId, tabId);
  }
};

const markExplanation = (
  explanationId: string,
  maps: LayoutReferenceMaps,
  stepId: string | null,
  tabId: string | null,
): void => {
  if (maps.explanationIdsInLayout.has(explanationId)) {
    throw new TypeError(kitErrorMessages.explanationDuplicateInLayout(explanationId));
  }

  maps.explanationIdsInLayout.add(explanationId);
  if (stepId) {
    maps.explanationStepIds.set(explanationId, stepId);
  }
  if (tabId) {
    maps.explanationTabIds.set(explanationId, tabId);
  }
};

const resolveNodes = (
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
        return {
          kind: "field",
          field: node.field,
        };
      case "report":
        assertKnownReport(node.report, entities);
        markReport(node.report, maps, stepId, tabId);
        return {
          kind: "report",
          report: node.report,
        };
      case "explanation":
        assertKnownExplanation(node.explanation, entities);
        markExplanation(node.explanation, maps, stepId, tabId);
        return {
          kind: "explanation",
          explanation: node.explanation,
        };
    }
  });
};

const createDefaultSinglePageNodes = (
  fields: readonly FieldController[],
  explanations: readonly ExplanationController[],
  reports: readonly ReportController[],
): FormLayoutNode[] => [
  ...fields.map<FormLayoutNode>((field) => ({
    kind: "field",
    field: field.id,
  })),
  ...explanations.map<FormLayoutNode>((explanation) => ({
    kind: "explanation",
    explanation: explanation.id,
  })),
  ...reports.map<FormLayoutNode>((report) => ({
    kind: "report",
    report: report.id,
  })),
];

const assertAllFieldsCovered = (
  fields: readonly FieldController[],
  maps: LayoutReferenceMaps,
): void => {
  for (const field of fields) {
    if (!maps.fieldIdsInLayout.has(field.id)) {
      throw new TypeError(kitErrorMessages.fieldMissingInLayout(field.id));
    }
  }
};

export const resolveFormLayout = (
  layout: FormLayoutConfig | undefined,
  fields: readonly FieldController[],
  reports: readonly ReportController[],
  explanations: readonly ExplanationController[],
): ResolvedLayoutResult => {
  const entities = createEntityMaps(fields, reports, explanations);
  const maps = createReferenceMaps();
  const nodeIds = new Map<string, number>();

  if (!layout || layout.kind === undefined || layout.kind === "single-page") {
    const children = resolveNodes(
      layout?.children ?? createDefaultSinglePageNodes(fields, explanations, reports),
      entities,
      maps,
      nodeIds,
      null,
      null,
    );
    assertAllFieldsCovered(fields, maps);
    return {
      layout: {
        kind: "single-page",
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
      const children = resolveNodes(tab.children, entities, maps, nodeIds, null, tabId);
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

  if (layout.kind === "accordion") {
    if (layout.sections.length === 0) {
      throw new TypeError(kitErrorMessages.accordionRequiresSections);
    }

    const sectionIds = new Map<string, number>();
    const sections = layout.sections.map((section, index) => {
      const sectionId = nextNodeId(
        "section",
        section.id ?? section.title ?? `section-${index + 1}`,
        sectionIds,
      );
      const children = resolveNodes(section.children, entities, maps, nodeIds, null, sectionId);
      if (children.length === 0) {
        throw new TypeError(kitErrorMessages.accordionSectionEmpty(sectionId));
      }

      return {
        id: sectionId,
        title: section.title,
        description: section.description,
        defaultOpen: section.defaultOpen ?? index === 0,
        children,
      };
    });

    assertAllFieldsCovered(fields, maps);

    return {
      layout: {
        kind: "accordion",
        sections,
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
      const children = resolveNodes(step.children, entities, maps, nodeIds, stepId, null);
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
