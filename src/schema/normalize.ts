// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { RegistryError } from "./registry";
import { normalizeSchemaId, runtimeIdPattern } from "./ids";
import type { FieldConfig, NormalizedFieldConfig } from "./types/field";
import type { FormSchema, NormalizedFormSchema } from "./types/form";
import type { Registry } from "./types/registry";
import type { NormalizedReportConfig, ReportConfig } from "./types/report";
import { normalizeFieldContracts } from "./field-contracts";
import { parseFieldConfig, parseReportConfig } from "./config-schema";

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

export const unsupportedSchemaKeys = (schema: object): string[] =>
  Object.keys(schema).filter((key) => key !== "fields" && key !== "reports");

const resolveId = (
  explicitId: string | undefined,
  fallbackLabel: string,
  usedIds: Set<string>,
  fallbackPrefix: string,
  path: readonly (string | number)[],
  reservedIds: ReadonlySet<string>,
): string => {
  const baseId = explicitId ?? normalizeSchemaId(fallbackLabel || fallbackPrefix);

  if (explicitId) {
    if (usedIds.has(baseId)) {
      throw new SchemaNormalizationError(`Duplicate explicit id "${baseId}" in schema.`, path);
    }

    usedIds.add(baseId);
    return baseId;
  }

  let candidate = baseId;
  let suffix = 2;
  while (
    !runtimeIdPattern.test(candidate) ||
    usedIds.has(candidate) ||
    reservedIds.has(candidate)
  ) {
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
  reservedIds: ReadonlySet<string>,
): NormalizedFieldConfig => {
  const definition = registry.getField(field.kind);
  if (!definition) {
    throw new RegistryError(`Unknown field kind "${field.kind}".`);
  }

  const parsed = parseFieldConfig(definition.schema, field);
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
    id: resolveId(
      parsed.id,
      parsed.label,
      usedIds,
      `field-${index + 1}`,
      ["fields", index, "id"],
      reservedIds,
    ),
  };
};

const normalizeReport = (
  report: ReportConfig,
  index: number,
  registry: Registry,
  usedIds: Set<string>,
  reservedIds: ReadonlySet<string>,
): NormalizedReportConfig => {
  const definition = registry.getReport(report.kind);
  if (!definition) {
    throw new RegistryError(`Unknown report kind "${report.kind}".`);
  }

  const parsed = parseReportConfig(definition.schema, report);
  const id = resolveId(
    parsed.id,
    parsed.label ?? parsed.kind,
    usedIds,
    `report-${index + 1}`,
    ["reports", index, "id"],
    reservedIds,
  );
  return {
    ...parsed,
    id,
  };
};

export const normalizeSchema = (schema: FormSchema, registry: Registry): NormalizedFormSchema => {
  for (const key of unsupportedSchemaKeys(schema)) {
    throw new SchemaNormalizationError(`Unsupported schema property "${key}".`, [key]);
  }
  const usedFieldIds = new Set<string>();
  const usedReportIds = new Set<string>();
  const explicitIds = (items: readonly { id?: string }[]) =>
    new Set(items.flatMap(({ id }) => (typeof id === "string" ? [id] : [])));
  const reservedFieldIds = explicitIds(schema.fields);
  const reservedReportIds = explicitIds(schema.reports ?? []);
  const parsedFields = schema.fields.map((field, index) =>
    normalizeField(field, index, registry, usedFieldIds, reservedFieldIds),
  );
  const fields = normalizeFieldContracts(parsedFields, registry, (message, path) => {
    throw new SchemaNormalizationError(message, path);
  });
  const reports = (schema.reports ?? []).map((report, index) =>
    normalizeReport(report, index, registry, usedReportIds, reservedReportIds),
  );
  return {
    fields,
    reports,
  };
};
