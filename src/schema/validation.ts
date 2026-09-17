// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { array, never, strictObject, toJSONSchema, xor, type ZodType } from "zod";
import { normalizeSchema, SchemaNormalizationError } from "./normalize";
import { composeFieldConfigSchema, composeReportConfigSchema } from "./config-schema";
import type { FieldConfig } from "./types/field";
import type { FormSchema, NormalizedFormSchema } from "./types/form";
import type { Registry } from "./types/registry";

export type SchemaIssuePath = readonly (string | number)[];

export type SchemaValidationIssue = {
  path: SchemaIssuePath;
  message: string;
  code: "invalid-schema" | "unknown-kind" | "invalid-config";
};

export type UnknownSchemaKind = {
  section: "fields" | "reports";
  index: number;
  kind: string;
  path: SchemaIssuePath;
};

export type SchemaValidationResult =
  | { success: true; data: NormalizedFormSchema; issues: readonly [] }
  | { success: false; issues: readonly SchemaValidationIssue[] };

export type SchemaJsonSchema = Record<string, unknown>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

type DefinitionParseResult =
  | { success: true; data: unknown }
  | {
      success: false;
      error: { issues: readonly { path: readonly PropertyKey[]; message: string }[] };
    };

const safeParseDefinition = (schema: ZodType, value: unknown): DefinitionParseResult => {
  const candidate = schema as unknown as {
    parse(input: unknown): unknown;
    safeParse?: (input: unknown) => DefinitionParseResult;
  };
  if (candidate.safeParse) return candidate.safeParse(value);

  try {
    return { success: true, data: candidate.parse(value) };
  } catch (error) {
    return {
      success: false,
      error: {
        issues: [
          {
            path: [],
            message: error instanceof Error ? error.message : "Definition parser rejected config.",
          },
        ],
      },
    };
  }
};

export const findUnknownKinds = (schema: unknown, registry: Registry): UnknownSchemaKind[] => {
  if (!isRecord(schema)) return [];

  const unknown: UnknownSchemaKind[] = [];
  const collect = (section: "fields" | "reports") => {
    const entries = schema[section];
    if (!Array.isArray(entries)) return;

    entries.forEach((entry, index) => {
      if (!isRecord(entry) || typeof entry.kind !== "string") return;
      const definition =
        section === "fields" ? registry.getField(entry.kind) : registry.getReport(entry.kind);
      if (!definition) {
        unknown.push({ section, index, kind: entry.kind, path: [section, index, "kind"] });
      }
      if (section === "fields") {
        const fieldDefinition = registry.getField(entry.kind);
        if (!fieldDefinition) return;
        const parsed = safeParseDefinition(composeFieldConfigSchema(fieldDefinition.schema), entry);
        if (!parsed.success) return;
        for (const reference of fieldDefinition.getNestedFieldReferences?.(
          parsed.data as FieldConfig,
        ) ?? []) {
          if (registry.getField(reference.kind)) continue;
          unknown.push({
            section,
            index,
            kind: reference.kind,
            path: [section, index, ...reference.path],
          });
        }
      }
    });
  };

  collect("fields");
  collect("reports");
  return unknown;
};

const validateSection = (
  section: "fields" | "reports",
  entries: unknown,
  registry: Registry,
  issues: SchemaValidationIssue[],
): void => {
  if (!Array.isArray(entries)) {
    issues.push({
      path: [section],
      message: `${section} must be an array.`,
      code: "invalid-schema",
    });
    return;
  }

  entries.forEach((entry, index) => {
    if (!isRecord(entry)) {
      issues.push({
        path: [section, index],
        message: `${section === "fields" ? "Field" : "Report"} must be an object.`,
        code: "invalid-config",
      });
      return;
    }
    if (typeof entry.kind !== "string" || entry.kind.length === 0) {
      issues.push({
        path: [section, index, "kind"],
        message: "kind must be a non-empty string.",
        code: "invalid-config",
      });
      return;
    }

    const definition =
      section === "fields" ? registry.getField(entry.kind) : registry.getReport(entry.kind);
    if (!definition) return;

    const schema =
      section === "fields"
        ? composeFieldConfigSchema(definition.schema)
        : composeReportConfigSchema(definition.schema);
    const parsed = safeParseDefinition(schema, entry);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const issuePath = issue.path.map((part) =>
          typeof part === "symbol" ? String(part) : part,
        );
        issues.push({
          path: [section, index, ...issuePath],
          message: issue.message,
          code: "invalid-config",
        });
      }
    }
  });
};

export const validateSchema = (schema: unknown, registry: Registry): SchemaValidationResult => {
  if (!isRecord(schema)) {
    return {
      success: false,
      issues: [{ path: [], message: "Schema must be an object.", code: "invalid-schema" }],
    };
  }

  const issues: SchemaValidationIssue[] = [];
  const allowed = new Set(["fields", "reports"]);
  for (const key of Object.keys(schema)) {
    if (!allowed.has(key)) {
      issues.push({
        path: [key],
        message: `Unsupported schema property "${key}".`,
        code: "invalid-schema",
      });
    }
  }

  validateSection("fields", schema.fields, registry, issues);
  validateSection("reports", schema.reports ?? [], registry, issues);
  for (const unknown of findUnknownKinds(schema, registry)) {
    issues.push({
      path: unknown.path,
      message: `Unknown ${unknown.section === "fields" ? "field" : "report"} kind "${unknown.kind}".`,
      code: "unknown-kind",
    });
  }

  if (issues.length > 0) return { success: false, issues };

  try {
    return {
      success: true,
      data: normalizeSchema(schema as unknown as FormSchema, registry),
      issues: [],
    };
  } catch (error) {
    const normalizationError = error instanceof SchemaNormalizationError ? error : undefined;
    return {
      success: false,
      issues: [
        {
          path: normalizationError?.path ?? [],
          message: error instanceof Error ? error.message : "Schema normalization failed.",
          code: normalizationError?.code ?? "invalid-schema",
        },
      ],
    };
  }
};

const registryItemsSchema = (
  definitions: readonly { kind: string; schema: ZodType }[],
  compose: (schema: ZodType) => ZodType,
) => {
  const schemas = definitions.map((definition) => {
    const schema = compose(definition.schema);
    if (!("_zod" in (schema as unknown as object))) {
      throw new TypeError(
        `Definition "${definition.kind}" must use a Zod schema to generate JSON Schema.`,
      );
    }
    return schema;
  });
  return schemas.length > 0 ? xor(schemas) : never();
};

/** Registered schemas that set metadata ids must use globally unique ids. */
export const toSchemaJsonSchema = (registry: Registry): SchemaJsonSchema =>
  toJSONSchema(
    strictObject({
      fields: array(registryItemsSchema(registry.listFields(), composeFieldConfigSchema)),
      reports: array(
        registryItemsSchema(registry.listReports(), composeReportConfigSchema),
      ).optional(),
    }),
    { target: "draft-2020-12", io: "input", unrepresentable: "any" },
  ) as SchemaJsonSchema;
