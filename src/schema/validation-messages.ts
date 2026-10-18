// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { NormalizedFieldConfig } from "./types/field";

export interface ValidationMessage {
  code: string;
  defaultMessage: string;
  args: readonly unknown[];
  field: NormalizedFieldConfig;
}

/** Return undefined to retain the default message. Scoped to one form. */
export type ValidationMessageFormatter = (message: ValidationMessage) => string | undefined;

export type { ValidationMessageResolver } from "./types/validation";
