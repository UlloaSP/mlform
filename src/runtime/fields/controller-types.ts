// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { FieldController, FieldValidationResult, InactiveFieldPolicy } from "../types";
import type { InternalFieldState } from "../state";
import type { FieldSubmissionEntry, MappedToTarget } from "@/schema";
import type { RestoredFieldOptions } from "./snapshot";

export type RefreshOptions = {
  values?: Record<string, unknown>;
  preserveValidationErrors?: boolean;
  preserveExternalErrors?: boolean;
  resetInactiveToInitial?: boolean;
  inactiveFieldPolicy?: InactiveFieldPolicy;
};

export type InternalFieldController = FieldController & {
  serialize(): unknown;
  refresh(options?: RefreshOptions): InternalFieldState;
  applyValue(value: unknown, values: Record<string, unknown>): void;
  prepareValue(value: unknown, values: Record<string, unknown>): InternalFieldState;
  commitState(state: InternalFieldState): void;
  setExternalErrors(errors: string[]): void;
  coerceValue(value: unknown): unknown;
  validate(validationVersion?: number): Promise<FieldValidationResult>;
  abortValidation(reason?: string): void;
  dispose(): void;
  getMappedTargets(backend?: string): readonly MappedToTarget[];
  getSubmissionEntries(backend?: string): readonly FieldSubmissionEntry[] | undefined;
  serializeSnapshotValue(): import("@/schema").JsonValue;
  restoreSnapshotValue(value: import("@/schema").JsonValue): unknown;
  prepareRestoredState(
    value: unknown,
    values: Record<string, unknown>,
    touched: boolean,
    options?: RestoredFieldOptions,
  ): InternalFieldState;
};
