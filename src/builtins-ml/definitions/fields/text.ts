// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import * as z from "zod";
import { builtinValidationMessages } from "@/runtime/constants";
import type { BaseFieldConfig, NormalizedFieldConfig } from "@/schema";
import { baseFieldShape, makeFieldDescriptor, type BuiltinFieldDefinition } from "../shared";

type TextFieldConfig = BaseFieldConfig & {
  kind: "text";
  placeholder?: string;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
};

export const textFieldDefinition: BuiltinFieldDefinition<TextFieldConfig, string> = {
  kind: "text",
  schema: z.object({
    kind: z.literal("text"),
    ...baseFieldShape,
    placeholder: z.string().optional(),
    minLength: z.number().int().nonnegative().optional(),
    maxLength: z.number().int().nonnegative().optional(),
    pattern: z.string().optional(),
  }),
  getDefaultValue(config) {
    return typeof config.defaultValue === "string" ? config.defaultValue : "";
  },
  normalizeValue(value) {
    if (typeof value === "string") {
      return value;
    }
    if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint") {
      return `${value}`;
    }
    return "";
  },
  validate(value, config) {
    const errors: string[] = [];
    if (
      config.minLength !== undefined &&
      config.maxLength !== undefined &&
      config.minLength > config.maxLength
    ) {
      errors.push(builtinValidationMessages.invalidTextLengthRange);
    }
    if (value.length === 0) {
      return errors;
    }
    if (config.minLength !== undefined && value.length < config.minLength) {
      errors.push(builtinValidationMessages.minLength(config.minLength));
    }
    if (config.maxLength !== undefined && value.length > config.maxLength) {
      errors.push(builtinValidationMessages.maxLength(config.maxLength));
    }
    if (config.pattern && !new RegExp(config.pattern).test(value)) {
      errors.push(builtinValidationMessages.textPatternMismatch);
    }
    return errors;
  },
  describe(config, context) {
    return makeFieldDescriptor("text-field", config as NormalizedFieldConfig<TextFieldConfig>, {
      value: context.state.value,
      placeholder: config.placeholder ?? "",
      minLength: config.minLength,
      maxLength: config.maxLength,
      pattern: config.pattern,
      state: context.state.status,
      errors: context.state.errors,
    });
  },
};
