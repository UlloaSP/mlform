// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { EngineError } from "../errors";
import type { InternalFieldController } from "../fields";
import type { InternalReportController } from "../reports";
import type { FormSnapshot, FormSnapshotField, FormSnapshotSchemaEntry } from "../types";
import { deepFreeze, isRecord } from "../utils";
import { cloneJsonValue } from "./json-value";

const schemaEntries = (
  controllers: readonly { id: string; kind: string }[],
): FormSnapshotSchemaEntry[] => controllers.map(({ id, kind }) => ({ id, kind }));

const assertSchemaEntries = (
  value: unknown,
  expected: readonly FormSnapshotSchemaEntry[],
  label: string,
): void => {
  if (!Array.isArray(value) || value.length !== expected.length) {
    throw new EngineError(`Snapshot ${label} do not match the current schema.`);
  }
  const actual = new Map<string, string>();
  for (const entry of value) {
    if (!isRecord(entry) || typeof entry.id !== "string" || typeof entry.kind !== "string") {
      throw new EngineError(`Snapshot ${label} signature is invalid.`);
    }
    if (actual.has(entry.id)) throw new EngineError(`Snapshot ${label} contain duplicate ids.`);
    actual.set(entry.id, entry.kind);
  }
  for (const entry of expected) {
    if (actual.get(entry.id) !== entry.kind) {
      throw new EngineError(`Snapshot ${label} do not match the current schema.`);
    }
  }
};

export const createFormSnapshot = (
  fields: readonly InternalFieldController[],
  reports: readonly InternalReportController[],
): FormSnapshot =>
  deepFreeze({
    version: 1,
    schema: { fields: schemaEntries(fields), reports: schemaEntries(reports) },
    fields: Object.fromEntries(
      fields.map((field) => [
        field.id,
        { value: field.serializeSnapshotValue(), touched: field.state.touched },
      ]),
    ),
  });

export const parseFormSnapshot = (
  snapshot: unknown,
  fields: readonly InternalFieldController[],
  reports: readonly InternalReportController[],
): Map<string, FormSnapshotField> => {
  if (!isRecord(snapshot) || snapshot.version !== 1) {
    throw new EngineError("Unsupported form snapshot version.");
  }
  if (!isRecord(snapshot.schema)) throw new EngineError("Snapshot schema signature is missing.");
  assertSchemaEntries(snapshot.schema.fields, schemaEntries(fields), "fields");
  assertSchemaEntries(snapshot.schema.reports, schemaEntries(reports), "reports");
  if (!isRecord(snapshot.fields)) throw new EngineError("Snapshot fields are invalid.");
  const snapshotFields = snapshot.fields;

  const expectedIds = new Set(fields.map((field) => field.id));
  const actualIds = Object.keys(snapshotFields);
  if (actualIds.length !== expectedIds.size || actualIds.some((id) => !expectedIds.has(id))) {
    throw new EngineError("Snapshot field values do not match the current schema.");
  }

  return new Map(
    fields.map((field): [string, FormSnapshotField] => {
      const entry = snapshotFields[field.id];
      if (!isRecord(entry) || typeof entry.touched !== "boolean" || !("value" in entry)) {
        throw new EngineError(`Snapshot field "${field.id}" is invalid.`);
      }
      return [
        field.id,
        {
          value: cloneJsonValue(entry.value, `fields.${field.id}.value`),
          touched: entry.touched,
        },
      ];
    }),
  );
};
