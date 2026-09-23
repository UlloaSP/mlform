// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { normalizeSchemaId } from "./ids";
import { resolveMappedTargets } from "./mapped-to";
import { normalizeSubmissionPath } from "./submission-path";
import type {
  DeclarativeFieldCondition,
  FieldCondition,
  NormalizedFieldConfig,
} from "./types/field";
import type { Registry } from "./types/registry";

type ContractFailure = (message: string, path: readonly (string | number)[]) => never;

const normalizeReference = (
  reference: string,
  fieldIds: ReadonlySet<string>,
  path: readonly (string | number)[],
  fail: ContractFailure,
): string => {
  const normalized = normalizeSchemaId(reference);
  if (!fieldIds.has(normalized)) {
    fail(`Field condition references unknown field "${reference}".`, path);
  }
  return normalized;
};

const normalizeDeclarativeCondition = (
  condition: DeclarativeFieldCondition,
  fieldIds: ReadonlySet<string>,
  path: readonly (string | number)[],
  fail: ContractFailure,
): DeclarativeFieldCondition => {
  switch (condition.kind) {
    case "field-value":
      return {
        ...condition,
        field: normalizeReference(condition.field, fieldIds, [...path, "field"], fail),
      };
    case "field-comparison":
      return {
        ...condition,
        field: normalizeReference(condition.field, fieldIds, [...path, "field"], fail),
        otherField: normalizeReference(
          condition.otherField,
          fieldIds,
          [...path, "otherField"],
          fail,
        ),
      };
    case "all":
    case "any":
      return {
        ...condition,
        conditions: condition.conditions.map((entry, index) =>
          normalizeDeclarativeCondition(entry, fieldIds, [...path, "conditions", index], fail),
        ),
      };
    case "not":
      return {
        ...condition,
        condition: normalizeDeclarativeCondition(
          condition.condition,
          fieldIds,
          [...path, "condition"],
          fail,
        ),
      };
    default:
      return condition;
  }
};

const normalizeCondition = (
  condition: FieldCondition | undefined,
  fieldIds: ReadonlySet<string>,
  path: readonly (string | number)[],
  fail: ContractFailure,
): FieldCondition | undefined =>
  typeof condition === "function" || condition === undefined
    ? condition
    : normalizeDeclarativeCondition(condition, fieldIds, path, fail);

const pathsOverlap = (left: readonly string[], right: readonly string[]): boolean => {
  const sharedLength = Math.min(left.length, right.length);
  return left.slice(0, sharedLength).every((segment, index) => segment === right[index]);
};

type SubmissionPath = {
  fieldId: string;
  path: string[];
};

const validateSubmissionPaths = (
  fields: readonly NormalizedFieldConfig[],
  registry: Registry,
  fail: ContractFailure,
): void => {
  const paths: SubmissionPath[] = [];

  fields.forEach((field, fieldIndex) => {
    if (field.includeInSubmission === false) return;
    const definition = registry.getField(field.kind);
    if (definition?.getSubmissionEntries && !definition.getMappedTargets) {
      fail(
        `Field definition "${field.kind}" provides submission entries without declaring their targets through getMappedTargets.`,
        ["fields", fieldIndex, "kind"],
      );
    }
    const targets = definition?.getMappedTargets
      ? definition.getMappedTargets(field, {})
      : resolveMappedTargets(field.mappedTo, undefined);
    const candidates: readonly (string | number | string[])[] =
      targets.length > 0 ? targets : field.valuePath === undefined ? [] : [field.valuePath];

    for (const candidate of candidates) {
      const issuePath = ["fields", fieldIndex, targets.length > 0 ? "mappedTo" : "valuePath"];
      let path: string[];
      try {
        path = normalizeSubmissionPath(candidate);
      } catch (error) {
        fail(error instanceof Error ? error.message : String(error), issuePath);
      }
      if (path.length === 0) {
        fail(`Field "${field.id}" resolves to an empty submission path.`, [
          "fields",
          fieldIndex,
          "mappedTo",
        ]);
      }
      const existing = paths.find((entry) => pathsOverlap(entry.path, path));
      if (existing) {
        const currentPath = path.join(".");
        const existingPath = existing.path.join(".");
        const message =
          currentPath === existingPath
            ? `Duplicate submission path "${currentPath}" for fields "${existing.fieldId}" and "${field.id}".`
            : `Submission path "${currentPath}" for field "${field.id}" overlaps submission path "${existingPath}" for field "${existing.fieldId}".`;
        fail(message, issuePath);
      }
      paths.push({ fieldId: field.id, path });
    }
  });
};

export const normalizeFieldContracts = (
  fields: readonly NormalizedFieldConfig[],
  registry: Registry,
  fail: ContractFailure,
): NormalizedFieldConfig[] => {
  const fieldIds = new Set(fields.map((field) => field.id));
  const displayKeys = new Map<string, string>();

  const normalized = fields.map((field, index): NormalizedFieldConfig => {
    const definition = registry.getField(field.kind);
    for (const reference of definition?.getFieldReferences?.(field) ?? []) {
      const id = normalizeSchemaId(reference.id);
      if (!fieldIds.has(id)) {
        fail(
          reference.unknownFieldMessage ??
            `Field "${field.id}" references unknown field "${reference.id}".`,
          ["fields", index, ...reference.path],
        );
      }
    }
    const displayKey = typeof field.displayKey === "string" ? field.displayKey.trim() : undefined;
    if (typeof field.displayKey === "string" && !displayKey) {
      fail(`Field "${field.id}": displayKey must not be empty.`, ["fields", index, "displayKey"]);
    }
    if (displayKey) {
      const existing = displayKeys.get(displayKey);
      if (existing) {
        fail(
          `Field "${field.id}": duplicate displayKey "${displayKey}" also used by "${existing}".`,
          ["fields", index, "displayKey"],
        );
      }
      displayKeys.set(displayKey, field.id);
    }

    return {
      ...field,
      ...(typeof field.displayKey === "string" ? { displayKey } : {}),
      disabledWhen: normalizeCondition(
        field.disabledWhen,
        fieldIds,
        ["fields", index, "disabledWhen"],
        fail,
      ),
      hiddenWhen: normalizeCondition(
        field.hiddenWhen,
        fieldIds,
        ["fields", index, "hiddenWhen"],
        fail,
      ),
      readOnlyWhen: normalizeCondition(
        field.readOnlyWhen,
        fieldIds,
        ["fields", index, "readOnlyWhen"],
        fail,
      ),
    };
  });

  validateSubmissionPaths(normalized, registry, fail);
  return normalized;
};
