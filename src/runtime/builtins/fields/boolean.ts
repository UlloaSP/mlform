// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import * as z from "zod";
import { builtinValidationMessages } from "../../constants";
import type { BaseFieldConfig, FieldDefinition, NormalizedFieldConfig } from "../../types";
import { baseFieldShape, makeFieldDescriptor } from "../shared";

type BooleanFieldConfig = BaseFieldConfig & {
  kind: "boolean";
  trueLabel?: string;
  falseLabel?: string;
};

export const booleanFieldDefinition: FieldDefinition<BooleanFieldConfig, boolean> = {
  kind: "boolean",
  schema: z.object({
    kind: z.literal("boolean"),
    ...baseFieldShape,
    trueLabel: z.string().optional(),
    falseLabel: z.string().optional(),
  }),
  getDefaultValue(config) {
    return typeof config.defaultValue === "boolean" ? config.defaultValue : false;
  },
  normalizeValue(value) {
    return Boolean(value);
  },
  validate(value, config) {
    if (config.required && value !== true) {
      return [builtinValidationMessages.booleanRequired];
    }
    return [];
  },
  describe(config, context) {
    return makeFieldDescriptor(
      "boolean-field",
      config as NormalizedFieldConfig<BooleanFieldConfig>,
      {
        checked: context.state.value,
        trueLabel: config.trueLabel,
        falseLabel: config.falseLabel,
        state: context.state.status,
        errors: context.state.errors,
      },
    );
  },
};
