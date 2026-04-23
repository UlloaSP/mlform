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
  placeholder?: string;
};

export const numberFieldDefinition: FieldDefinition<NumberFieldConfig, number | string | null> = {
  kind: "number",
  schema: z.object({
    kind: z.literal("number"),
    ...baseFieldShape,
    min: z.number().optional(),
    max: z.number().optional(),
    step: z.number().positive().optional(),
    unit: z.string().optional(),
    placeholder: z.string().optional(),
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

    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed.length === 0) {
        return null;
      }

      const parsed = Number(trimmed);
      return Number.isNaN(parsed) ? value : parsed;
    }

    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  },
  validate(value, config) {
    const errors: string[] = [];
    if (config.min !== undefined && config.max !== undefined && config.min > config.max) {
      errors.push(builtinValidationMessages.invalidNumericRange);
    }
    if (value === null) {
      return errors;
    }
    if (typeof value !== "number") {
      errors.push(builtinValidationMessages.invalidNumber);
      return errors;
    }
    if (config.min !== undefined && value < config.min) {
      errors.push(builtinValidationMessages.minValue(config.min));
    }
    if (config.max !== undefined && value > config.max) {
      errors.push(builtinValidationMessages.maxValue(config.max));
    }
    if (config.step !== undefined) {
      const origin = config.min ?? 0;
      const diff = Math.abs(value - origin);
      const remainder = diff % config.step;
      const tolerance = config.step * 1e-9;
      if (remainder > tolerance && Math.abs(remainder - config.step) > tolerance) {
        errors.push(builtinValidationMessages.stepValue(config.step));
      }
    }
    return errors;
  },
  describe(config, context) {
    const useRange =
      config.min !== undefined &&
      config.max !== undefined &&
      !config.required &&
      context.state.value !== null;

    return makeFieldDescriptor("number-field", config as NormalizedFieldConfig<NumberFieldConfig>, {
      value: context.state.value,
      min: config.min,
      max: config.max,
      step: config.step,
      unit: config.unit,
      placeholder: config.placeholder ?? "",
      input: useRange ? "range" : "text",
      state: context.state.status,
      errors: context.state.errors,
    });
  },
};
