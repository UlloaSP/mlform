// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { toJSONSchema, type ZodType } from "zod";
import { normalizeSchema } from "./normalize";
import type { FormSchema, NormalizedFormSchema, Registry } from "./index";

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

    const parsed = definition.schema.safeParse(entry);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        issues.push({
          path: [
            section,
            index,
            ...issue.path.map((part) => (typeof part === "symbol" ? String(part) : part)),
          ],
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
    return {
      success: false,
      issues: [
        {
          path: [],
          message: error instanceof Error ? error.message : "Schema normalization failed.",
          code: "invalid-schema",
        },
      ],
    };
  }
};

const definitionSchemas = (definitions: readonly { schema: ZodType }[]): SchemaJsonSchema[] =>
  definitions.map(
    (definition) =>
      toJSONSchema(definition.schema, { io: "input", unrepresentable: "any" }) as SchemaJsonSchema,
  );

const registryItemsSchema = (definitions: readonly { schema: ZodType }[]) => {
  const schemas = definitionSchemas(definitions);
  return schemas.length > 0 ? { oneOf: schemas } : false;
};

export const toSchemaJsonSchema = (registry: Registry): SchemaJsonSchema => ({
  $schema: "https://json-schema.org/draft/2020-12/schema",
  type: "object",
  additionalProperties: false,
  required: ["fields"],
  properties: {
    fields: { type: "array", items: registryItemsSchema(registry.listFields()) },
    reports: { type: "array", items: registryItemsSchema(registry.listReports()) },
  },
});
