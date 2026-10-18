// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import * as z from "zod";
import { normalizeNumericValue } from "./numeric-value";
import { builtinMessage } from "../../validation-message";
import { builtinValidationMessages } from "../../constants";
import type { BaseFieldConfig } from "@/schema";
import { baseFieldShape, type BuiltinFieldDefinition } from "../shared";

type NumberFieldConfig = BaseFieldConfig & {
  kind: "number";
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  placeholder?: string;
};

export const numberFieldDefinition: BuiltinFieldDefinition<
  NumberFieldConfig,
  number | string | null
> = {
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
  normalizeValue: normalizeNumericValue,
  validateConfig(config, context) {
    if (config.min !== undefined && config.max !== undefined && config.min > config.max) {
      context.fail(builtinValidationMessages.invalidNumericRange, ["min"]);
    }
  },
  validateSync(value, config, context) {
    const errors: string[] = [];
    if (value === null) {
      return errors;
    }
    if (typeof value !== "number" || !Number.isFinite(value)) {
      errors.push(builtinMessage(context?.formatMessage, "invalidNumber"));
      return errors;
    }
    if (config.min !== undefined && value < config.min) {
      errors.push(builtinMessage(context?.formatMessage, "minValue", config.min));
    }
    if (config.max !== undefined && value > config.max) {
      errors.push(builtinMessage(context?.formatMessage, "maxValue", config.max));
    }
    if (config.step !== undefined) {
      const origin = config.min ?? 0;
      const nearest = origin + Math.round((value - origin) / config.step) * config.step;
      // Modular coordinates keep valid finite values checkable when the quotient overflows.
      const remainder = (value % config.step) / config.step - (origin % config.step) / config.step;
      const distance = Number.isFinite(nearest)
        ? Math.abs(value - nearest)
        : Math.abs(remainder - Math.round(remainder)) * config.step;
      // Bound floating-point rounding so it cannot hide a distinguishable fraction of a step.
      const tolerance = Math.min(
        config.step * 1e-3,
        Math.max(
          config.step * 1e-9,
          Number.EPSILON * Math.max(Math.abs(value), Math.abs(origin)) * 4,
        ),
      );
      if (distance > tolerance) {
        errors.push(builtinMessage(context?.formatMessage, "stepValue", config.step, origin));
      }
    }
    return errors;
  },
};
