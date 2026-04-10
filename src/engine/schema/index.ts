// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { EngineError, RegistryError } from "../errors";
import type {
  FieldConfig,
  FormSchema,
  NormalizedFieldConfig,
  NormalizedReportConfig,
  Registry,
  ReportConfig,
} from "../types";
import { slugify } from "../utils";

export interface NormalizedFormSchema {
  fields: NormalizedFieldConfig[];
  reports: NormalizedReportConfig[];
}

const resolveId = (
  explicitId: string | undefined,
  fallbackLabel: string,
  usedIds: Set<string>,
  fallbackPrefix: string,
): string => {
  const baseId = slugify((explicitId ?? fallbackLabel) || fallbackPrefix);

  if (explicitId) {
    if (usedIds.has(baseId)) {
      throw new EngineError(`Duplicate explicit id "${baseId}" in schema.`);
    }
    usedIds.add(baseId);
    return baseId;
  }

  let candidate = baseId;
  let suffix = 2;

  while (usedIds.has(candidate)) {
    candidate = `${baseId}-${suffix}`;
    suffix += 1;
  }

  usedIds.add(candidate);
  return candidate;
};

const normalizeField = (
  field: FieldConfig,
  index: number,
  registry: Registry,
  usedIds: Set<string>,
): NormalizedFieldConfig => {
  const definition = registry.getField(field.kind);
  if (!definition) {
    throw new RegistryError(`Unknown field kind "${field.kind}".`);
  }

  const parsed = definition.schema.parse(field) as FieldConfig;
  const id = resolveId(parsed.id, parsed.label, usedIds, `field-${index + 1}`);

  return {
    ...parsed,
    id,
  };
};

const normalizeReport = (
  report: ReportConfig,
  index: number,
  registry: Registry,
  usedIds: Set<string>,
): NormalizedReportConfig => {
  const definition = registry.getReport(report.kind);
  if (!definition) {
    throw new RegistryError(`Unknown report kind "${report.kind}".`);
  }

  const parsed = definition.schema.parse(report) as ReportConfig;
  const id = resolveId(parsed.id, parsed.label ?? parsed.kind, usedIds, `report-${index + 1}`);

  return {
    ...parsed,
    id,
    source: parsed.source ?? id,
  };
};

export const normalizeSchema = (schema: FormSchema, registry: Registry): NormalizedFormSchema => {
  const usedFieldIds = new Set<string>();
  const usedReportIds = new Set<string>();

  return {
    fields: schema.fields.map((field, index) =>
      normalizeField(field, index, registry, usedFieldIds),
    ),
    reports: (schema.reports ?? []).map((report, index) =>
      normalizeReport(report, index, registry, usedReportIds),
    ),
  };
};
