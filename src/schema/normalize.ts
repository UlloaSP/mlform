// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { RegistryError } from "./registry";
import { normalizeSchemaId } from "./ids";
import type {
  FieldConfig,
  FormSchema,
  NormalizedFieldConfig,
  NormalizedFormSchema,
  NormalizedReportConfig,
  Registry,
  ReportConfig,
} from "./index";

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

const validateSeriesSubField = (
  parentLabel: string,
  name: "field1" | "field2",
  field: unknown,
  registry: Registry,
  fieldIndex: number,
): void => {
  if (typeof field !== "object" || field === null) {
    throw new SchemaNormalizationError(
      `Series field "${parentLabel}" requires "${name}" configuration.`,
      ["fields", fieldIndex, name],
    );
  }

  const kind =
    "kind" in field && typeof (field as { kind?: unknown }).kind === "string"
      ? (field as { kind: string }).kind
      : "";

  if (kind.length === 0) {
    throw new SchemaNormalizationError(`Series field "${parentLabel}" requires "${name}.kind".`, [
      "fields",
      fieldIndex,
      name,
      "kind",
    ]);
  }

  if (kind === "series") {
    throw new SchemaNormalizationError(
      `Series field "${parentLabel}" cannot nest series in "${name}".`,
      ["fields", fieldIndex, name, "kind"],
    );
  }

  if (!registry.getField(kind)) {
    throw new SchemaNormalizationError(
      `Series field "${parentLabel}" uses unknown sub-field kind "${kind}" in "${name}".`,
      ["fields", fieldIndex, name, "kind"],
      "unknown-kind",
    );
  }
};

const validateSeriesFieldConfig = (
  field: FieldConfig,
  registry: Registry,
  fieldIndex: number,
): void => {
  if (field.kind !== "series") {
    return;
  }

  validateSeriesSubField(field.label, "field1", field.field1, registry, fieldIndex);
  validateSeriesSubField(field.label, "field2", field.field2, registry, fieldIndex);

  if (
    typeof field.minPoints === "number" &&
    typeof field.maxPoints === "number" &&
    field.minPoints > field.maxPoints
  ) {
    throw new SchemaNormalizationError(
      `Series field "${field.label}" requires minPoints to be less than or equal to maxPoints.`,
      ["fields", fieldIndex, "minPoints"],
    );
  }
};

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
  validateSeriesFieldConfig(parsed, registry, index);
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
  const reports = (schema.reports ?? []).map((report, index) =>
    normalizeReport(report, index, registry, usedReportIds),
  );
  return {
    fields: schema.fields.map((field, index) =>
      normalizeField(field, index, registry, usedFieldIds),
    ),
    reports,
  };
};
