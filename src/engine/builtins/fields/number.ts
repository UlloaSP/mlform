// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import * as z from "zod";
import { builtinValidationMessages } from "../../constants";
import type { BaseFieldConfig, FieldDefinition, NormalizedFieldConfig } from "../../types";
import { baseFieldShape, makeFieldDescriptor } from "../shared";

type NumberFieldConfig = BaseFieldConfig & {
  kind: "number";
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
};

export const numberFieldDefinition: FieldDefinition<NumberFieldConfig, number | null> = {
  kind: "number",
  schema: z.object({
    kind: z.literal("number"),
    ...baseFieldShape,
    min: z.number().optional(),
    max: z.number().optional(),
    step: z.number().positive().optional(),
    unit: z.string().optional(),
  }),
  getDefaultValue(config) {
    return typeof config.defaultValue === "number" ? config.defaultValue : null;
  },
  normalizeValue(value) {
    if (value === null || value === undefined || value === "") {
      return null;
    }

    if (typeof value === "number") {
      return Number.isNaN(value) ? null : value;
    }

    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  },
  validate(value, config) {
    const errors: string[] = [];
    if (value === null) {
      return errors;
    }
    if (config.min !== undefined && value < config.min) {
      errors.push(builtinValidationMessages.minValue(config.min));
    }
    if (config.max !== undefined && value > config.max) {
      errors.push(builtinValidationMessages.maxValue(config.max));
    }
    return errors;
  },
  describe(config, context) {
    return makeFieldDescriptor("number-field", config as NormalizedFieldConfig<NumberFieldConfig>, {
      value: context.state.value,
      min: config.min,
      max: config.max,
      step: config.step,
      unit: config.unit,
      state: context.state.status,
      errors: context.state.errors,
    });
  },
};
