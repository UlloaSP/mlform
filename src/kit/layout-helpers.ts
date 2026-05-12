// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { ExplanationController, FieldController, ReportController } from "@/runtime";
import { slugify } from "@/runtime/utils";
import { kitErrorMessages } from "./constants";
import type { FormLayoutNode } from "./types";

export type LayoutReferenceMaps = {
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

export type EntityMaps = {
  fieldIds: Set<string>;
  reportIds: Set<string>;
  explanationIds: Set<string>;
};

export const createEntityMaps = (
  fields: readonly FieldController[],
  reports: readonly ReportController[],
  explanations: readonly ExplanationController[],
): EntityMaps => ({
  fieldIds: new Set(fields.map((field) => field.id)),
  reportIds: new Set(reports.map((report) => report.id)),
  explanationIds: new Set(explanations.map((explanation) => explanation.id)),
});

export const createReferenceMaps = (): LayoutReferenceMaps => ({
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

export const nextNodeId = (
  prefix: string,
  preferred: string | undefined,
  counts: Map<string, number>,
): string => {
  const base = slugify(preferred ?? prefix) || prefix;
  const current = counts.get(base) ?? 0;
  counts.set(base, current + 1);
  return current === 0 ? base : `${base}-${current + 1}`;
};

export const assertKnownField = (fieldId: string, entities: EntityMaps): void => {
  if (!entities.fieldIds.has(fieldId)) {
    throw new TypeError(kitErrorMessages.unknownFieldReference(fieldId));
  }
};

export const assertKnownReport = (reportId: string, entities: EntityMaps): void => {
  if (!entities.reportIds.has(reportId)) {
    throw new TypeError(kitErrorMessages.unknownReportReference(reportId));
  }
};

export const assertKnownExplanation = (explanationId: string, entities: EntityMaps): void => {
  if (!entities.explanationIds.has(explanationId)) {
    throw new TypeError(kitErrorMessages.unknownExplanationReference(explanationId));
  }
};

export const markField = (
  fieldId: string,
  maps: LayoutReferenceMaps,
  stepId: string | null,
  tabId: string | null,
): void => {
  if (maps.fieldIdsInLayout.has(fieldId)) {
    throw new TypeError(kitErrorMessages.fieldDuplicateInLayout(fieldId));
  }
  maps.fieldIdsInLayout.add(fieldId);
  if (stepId) maps.fieldStepIds.set(fieldId, stepId);
  if (tabId) maps.fieldTabIds.set(fieldId, tabId);
};

export const markReport = (
  reportId: string,
  maps: LayoutReferenceMaps,
  stepId: string | null,
  tabId: string | null,
): void => {
  if (maps.reportIdsInLayout.has(reportId)) {
    throw new TypeError(kitErrorMessages.reportDuplicateInLayout(reportId));
  }
  maps.reportIdsInLayout.add(reportId);
  if (stepId) maps.reportStepIds.set(reportId, stepId);
  if (tabId) maps.reportTabIds.set(reportId, tabId);
};

export const markExplanation = (
  explanationId: string,
  maps: LayoutReferenceMaps,
  stepId: string | null,
  tabId: string | null,
): void => {
  if (maps.explanationIdsInLayout.has(explanationId)) {
    throw new TypeError(kitErrorMessages.explanationDuplicateInLayout(explanationId));
  }
  maps.explanationIdsInLayout.add(explanationId);
  if (stepId) maps.explanationStepIds.set(explanationId, stepId);
  if (tabId) maps.explanationTabIds.set(explanationId, tabId);
};

export const createDefaultSinglePageNodes = (
  fields: readonly FieldController[],
  explanations: readonly ExplanationController[],
  reports: readonly ReportController[],
): FormLayoutNode[] => [
  ...fields.map<FormLayoutNode>((field) => ({ kind: "field", field: field.id })),
  ...explanations.map<FormLayoutNode>((explanation) => ({
    kind: "explanation",
    explanation: explanation.id,
  })),
  ...reports.map<FormLayoutNode>((report) => ({ kind: "report", report: report.id })),
];

export const assertAllFieldsCovered = (
  fields: readonly FieldController[],
  maps: LayoutReferenceMaps,
): void => {
  for (const field of fields) {
    if (!maps.fieldIdsInLayout.has(field.id)) {
      throw new TypeError(kitErrorMessages.fieldMissingInLayout(field.id));
    }
  }
};
