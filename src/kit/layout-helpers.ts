// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { FieldController, ReportController } from "@/runtime";
import { normalizeSchemaId } from "@/schema";
import { kitErrorMessages } from "./constants";
import type { FormLayoutNode } from "./types";

export type LayoutReferenceMaps = {
  fieldStepIds: Map<string, string>;
  reportStepIds: Map<string, string>;
  fieldTabIds: Map<string, string>;
  reportTabIds: Map<string, string>;
  fieldSectionIds: Map<string, string>;
  reportSectionIds: Map<string, string>;
  fieldIdsInLayout: Set<string>;
  reportIdsInLayout: Set<string>;
};

export type EntityMaps = {
  fieldIds: Set<string>;
  reportIds: Set<string>;
};

export const createEntityMaps = (
  fields: readonly FieldController[],
  reports: readonly ReportController[],
): EntityMaps => ({
  fieldIds: new Set(fields.map((field) => field.id)),
  reportIds: new Set(reports.map((report) => report.id)),
});

export const createReferenceMaps = (): LayoutReferenceMaps => ({
  fieldStepIds: new Map(),
  reportStepIds: new Map(),
  fieldTabIds: new Map(),
  reportTabIds: new Map(),
  fieldSectionIds: new Map(),
  reportSectionIds: new Map(),
  fieldIdsInLayout: new Set(),
  reportIdsInLayout: new Set(),
});

export const nextNodeId = (
  prefix: string,
  preferred: string | undefined,
  counts: Map<string, number>,
): string => {
  const base = normalizeSchemaId(preferred ?? prefix) || prefix;
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

export const markField = (
  fieldId: string,
  maps: LayoutReferenceMaps,
  stepId: string | null,
  tabId: string | null,
  sectionId: string | null,
): void => {
  if (maps.fieldIdsInLayout.has(fieldId)) {
    throw new TypeError(kitErrorMessages.fieldDuplicateInLayout(fieldId));
  }
  maps.fieldIdsInLayout.add(fieldId);
  if (stepId) maps.fieldStepIds.set(fieldId, stepId);
  if (tabId) maps.fieldTabIds.set(fieldId, tabId);
  if (sectionId) maps.fieldSectionIds.set(fieldId, sectionId);
};

export const markReport = (
  reportId: string,
  maps: LayoutReferenceMaps,
  stepId: string | null,
  tabId: string | null,
  sectionId: string | null,
): void => {
  if (maps.reportIdsInLayout.has(reportId)) {
    throw new TypeError(kitErrorMessages.reportDuplicateInLayout(reportId));
  }
  maps.reportIdsInLayout.add(reportId);
  if (stepId) maps.reportStepIds.set(reportId, stepId);
  if (tabId) maps.reportTabIds.set(reportId, tabId);
  if (sectionId) maps.reportSectionIds.set(reportId, sectionId);
};

export const createDefaultSinglePageNodes = (
  fields: readonly FieldController[],
  reports: readonly ReportController[],
): FormLayoutNode[] => [
  ...fields.map<FormLayoutNode>((field) => ({ kind: "field", field: field.id })),
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
