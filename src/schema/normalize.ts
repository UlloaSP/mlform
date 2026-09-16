// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { RegistryError } from "./registry";
import { normalizeSchemaId } from "./ids";
import type { FieldConfig, NormalizedFieldConfig } from "./types/field";
import type { FormSchema, NormalizedFormSchema } from "./types/form";
import type { Registry } from "./types/registry";
import type { NormalizedReportConfig, ReportConfig } from "./types/report";
import { normalizeFieldContracts } from "./field-contracts";

export class SchemaNormalizationError extends Error {
  constructor(
    message: string,
    readonly path: readonly (string | number)[],
    readonly code: "invalid-config" | "unknown-kind" = "invalid-config",
  ) {
    super(message);
    this.name = "SchemaNormalizationError";
  }
}

const resolveId = (
  explicitId: string | undefined,
  fallbackLabel: string,
  usedIds: Set<string>,
  fallbackPrefix: string,
  path: readonly (string | number)[],
): string => {
  const baseId = normalizeSchemaId((explicitId ?? fallbackLabel) || fallbackPrefix);

  if (explicitId) {
    if (usedIds.has(baseId)) {
      throw new SchemaNormalizationError(`Duplicate explicit id "${baseId}" in schema.`, path);
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
  definition.validateConfig?.(parsed, {
    fail(message, path = [], code = "invalid-config") {
      throw new SchemaNormalizationError(message, ["fields", index, ...path], code);
    },
  });
  for (const reference of definition.getNestedFieldReferences?.(parsed) ?? []) {
    if (!registry.getField(reference.kind)) {
      throw new SchemaNormalizationError(
        reference.unknownKindMessage ??
          `Field "${parsed.label}" uses unknown nested field kind "${reference.kind}".`,
        ["fields", index, ...reference.path],
        "unknown-kind",
      );
    }
  }
  return {
    ...parsed,
    id: resolveId(parsed.id, parsed.label, usedIds, `field-${index + 1}`, ["fields", index, "id"]),
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
  const id = resolveId(
    report.id ?? parsed.id,
    report.label ?? parsed.label ?? parsed.kind,
    usedIds,
    `report-${index + 1}`,
    ["reports", index, "id"],
  );
  return {
    ...parsed,
    ...(report.label === undefined ? {} : { label: report.label }),
    ...(report.description === undefined ? {} : { description: report.description }),
    ...(report.mappedTo === undefined ? {} : { mappedTo: report.mappedTo }),
    ...(report.ui === undefined ? {} : { ui: report.ui }),
    id,
  };
};

export const normalizeSchema = (schema: FormSchema, registry: Registry): NormalizedFormSchema => {
  const usedFieldIds = new Set<string>();
  const usedReportIds = new Set<string>();
  const parsedFields = schema.fields.map((field, index) =>
    normalizeField(field, index, registry, usedFieldIds),
  );
  const fields = normalizeFieldContracts(parsedFields, registry, (message, path) => {
    throw new SchemaNormalizationError(message, path);
  });
  const reports = (schema.reports ?? []).map((report, index) =>
    normalizeReport(report, index, registry, usedReportIds),
  );
  return {
    fields,
    reports,
  };
};
