// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { EngineError } from "./errors";
import type { RefreshOptions, InternalFieldController } from "./fields";
import type { InternalFieldState } from "./state";
import { cloneValue } from "./values";

type GetFieldMap = () => Map<string, InternalFieldController>;
type GetValues = () => Record<string, unknown>;
type CreateRuntimeValuesOptions = {
  getFieldMap: GetFieldMap;
  getValues: GetValues;
  getCurrentFieldState: (fieldId: string) => InternalFieldState | undefined;
  syncDerivedFieldState: (options?: RefreshOptions) => void;
  shouldResetInactiveFields: () => boolean;
  inactiveFieldPolicy: RefreshOptions["inactiveFieldPolicy"];
};

const resolveField = (
  fieldMap: Map<string, InternalFieldController>,
  targetId: string,
): InternalFieldController | undefined => {
  return fieldMap.get(targetId);
};

export const createRuntimeValues = ({
  getFieldMap,
  getValues,
  getCurrentFieldState,
  syncDerivedFieldState,
  shouldResetInactiveFields,
  inactiveFieldPolicy,
}: CreateRuntimeValuesOptions) => {
  const commitDerivedValue = (targetId: string, value: unknown): void => {
    const targetField = resolveField(getFieldMap(), targetId);
    if (!targetField) {
      throw new EngineError(`Unknown field "${targetId}".`);
    }

    const coerced = targetField.coerceValue(value);
    const nextValues = {
      ...getValues(),
      [targetField.id]: coerced,
    };
    const currentState = getCurrentFieldState(targetField.id);
    if (!currentState) {
      return;
    }

    targetField.commitState({
      ...currentState,
      value: coerced,
    });
    syncDerivedFieldState({
      values: nextValues,
      preserveValidationErrors: false,
      preserveExternalErrors: false,
      resetInactiveToInitial: shouldResetInactiveFields(),
      inactiveFieldPolicy,
    });
    void targetField.validate();
  };

  return {
    getValues: () =>
      Object.fromEntries(
        Object.entries(getValues()).map(([fieldId, value]) => [fieldId, cloneValue(value)]),
      ),
    commitDerivedValue,
  };
};
