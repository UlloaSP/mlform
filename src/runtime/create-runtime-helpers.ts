// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { EngineError } from "./errors";
import type { InternalFieldState } from "./state";
import type { CreateFormConfig, InactiveFieldPolicy } from "./types";

export const assertTransport = (transport: CreateFormConfig["transport"]): void => {
  if (!transport || typeof transport.submit !== "function") {
    throw new EngineError("createForm requires a transport with a submit(request) function.");
  }
};

export const hasInteractiveFieldState = (
  fieldStates: Record<string, InternalFieldState>,
): boolean => {
  for (const fieldId in fieldStates) {
    const fieldState = fieldStates[fieldId];
    if (fieldState?.dirty || fieldState?.touched) {
      return true;
    }
  }

  return false;
};

export const resolveInactiveFieldPolicy = (
  field: {
    readonly config: { readonly inactiveFieldPolicy?: InactiveFieldPolicy };
  },
  fallbackPolicy: InactiveFieldPolicy | undefined,
): InactiveFieldPolicy => {
  return field.config.inactiveFieldPolicy ?? fallbackPolicy ?? "omit";
};

export const missingDefinitionError = (type: string, kind: string): EngineError => {
  return new EngineError(`${type} definition "${kind}" disappeared during form creation.`);
};
