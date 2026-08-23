// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

type MaybePromise<T> = T | PromiseLike<T>;

import type { Registry } from "@/schema";
import type { SubmissionInputRecord } from "@/schema";
import type { FieldHandle } from "./field";
import type { FormStatus } from "./form";

export interface RuntimeBehaviorValueChangeEvent {
  fieldId: string;
  values: Record<string, unknown>;
}

export interface RuntimeBehaviorSubmissionRecords {
  inputs: SubmissionInputRecord[];
  displayValues: Record<string, unknown>;
  modelValues: Record<string, unknown>;
  values: Record<string, unknown>;
  fieldValues: Record<string, unknown>;
  serializedValues: Record<string, unknown>;
  serializedFieldValues: Record<string, unknown>;
}

export interface RuntimeBehaviorContext {
  readonly registry: Registry;
  readonly fields: readonly FieldHandle[];
  getField(id: string): FieldHandle | undefined;
  resolveFieldId(id: string): string | undefined;
  getValues(): Record<string, unknown>;
  getSubmitCount(): number;
  getFormStatus(): FormStatus;
  commitDerivedValue(fieldId: string, value: unknown): void;
  syncDerivedState(values?: Record<string, unknown>): void;
}

export interface RuntimeBehavior {
  validate?(context: RuntimeBehaviorContext): void;
  onValuesChanged?(
    event: RuntimeBehaviorValueChangeEvent,
    context: RuntimeBehaviorContext,
  ): MaybePromise<void>;
  beforeSubmitRecords?(
    records: RuntimeBehaviorSubmissionRecords,
    context: RuntimeBehaviorContext,
  ): MaybePromise<void>;
}
