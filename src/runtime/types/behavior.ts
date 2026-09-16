// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

type MaybePromise<T> = T | PromiseLike<T>;

import type { Registry } from "@/schema";
import type { SubmissionInputRecord } from "@/schema";
import type { FieldController } from "./field";
import type { FormStatus } from "./status";

export interface RuntimeBehaviorValueChangeEvent {
  fieldId: string;
  values: Record<string, unknown>;
}

export interface RuntimeBehaviorSubmissionRecords {
  inputs: SubmissionInputRecord[];
  displayValues: Record<string, unknown>;
  modelValues: Record<string, unknown>;
}

export interface RuntimeBehaviorContext {
  readonly registry: Registry;
  readonly fields: readonly FieldController[];
  readonly signal?: AbortSignal;
  readonly changeVersion?: number;
  getField(id: string): FieldController | undefined;
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
