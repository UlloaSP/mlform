// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

export type {
  AllConditions,
  AnyConditions,
  BaseFieldConfig,
  DeclarativeFieldCondition,
  FieldComparisonCondition,
  FieldCondition,
  FieldConditionContext,
  FieldConfig,
  FieldStateSnapshot,
  FieldStatus,
  FieldValidationContext,
  FieldValidationFnContext,
  FieldValidationResult,
  FieldValueAdapter,
  FieldValueCondition,
  FormOperationCondition,
  FormSubmissionStatusCondition,
  InactiveFieldPolicy,
  JsonValue,
  NormalizedFieldConfig,
  NotCondition,
  SelectorSubscriptionOptions,
  SubmitCountCondition,
} from "@/schema";

import type {
  FieldDefinition as SchemaFieldDefinition,
  FieldStateSnapshot,
  FieldValidationResult,
  NormalizedFieldConfig,
} from "@/schema";

export interface FieldController {
  readonly id: string;
  readonly kind: string;
  readonly config: NormalizedFieldConfig;
  readonly state: FieldStateSnapshot;
  setValue(value: unknown): void;
  blur(): void;
  focus(): void;
  serialize(): unknown;
  validate(): Promise<FieldValidationResult>;
  reset(): void;
  subscribe(listener: (state: FieldStateSnapshot) => void): () => void;
}

export type FieldDefinition<
  TConfig extends import("@/schema").FieldConfig = import("@/schema").FieldConfig,
  TValue = unknown,
> = SchemaFieldDefinition<TConfig, TValue>;
