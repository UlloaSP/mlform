// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { JsonValue, MaybePromise } from "@/schema";

export interface FormSnapshotSchemaEntry {
  id: string;
  kind: string;
}

export interface FormSnapshotField {
  value: JsonValue;
  touched: boolean;
}

export interface FormSnapshotV1 {
  version: 1;
  schema: {
    fields: FormSnapshotSchemaEntry[];
    reports: FormSnapshotSchemaEntry[];
  };
  fields: Record<string, FormSnapshotField>;
}

export type FormSnapshot = FormSnapshotV1;

export interface FormPersistenceAdapter {
  load(key: string): MaybePromise<unknown>;
  save(key: string, snapshot: FormSnapshot): MaybePromise<void>;
  remove(key: string): MaybePromise<void>;
}
