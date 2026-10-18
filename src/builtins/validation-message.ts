// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { ValidationMessageResolver } from "@/schema";
import { builtinValidationMessages } from "./constants";

type MessageArgs<K extends keyof typeof builtinValidationMessages> =
  (typeof builtinValidationMessages)[K] extends (...args: infer A) => string ? A : [];

export const builtinMessage = <K extends keyof typeof builtinValidationMessages>(
  resolve: ValidationMessageResolver | undefined,
  code: K,
  ...args: MessageArgs<K>
): string => {
  const template = builtinValidationMessages[code];
  const defaultMessage =
    typeof template === "string"
      ? template
      : (template as (...values: unknown[]) => string)(...args);
  return resolve?.(code, defaultMessage, args) ?? defaultMessage;
};
