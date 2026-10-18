// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import * as z from "zod";
import { builtinMessage } from "../../validation-message";
import { builtinValidationMessages } from "../../constants";
import type { BaseFieldConfig } from "@/schema";
import { baseFieldShape, type BuiltinFieldDefinition } from "../shared";

type RatingFieldConfig = BaseFieldConfig & {
  kind: "rating";
  min?: number;
  max: number;
  step?: number;
};

export const ratingFieldDefinition: BuiltinFieldDefinition<RatingFieldConfig, number | null> = {
  kind: "rating",
  schema: z.object({
    kind: z.literal("rating"),
    ...baseFieldShape,
    min: z.number().int().optional(),
    max: z.number().int().min(1),
    step: z.number().int().positive().optional(),
  }),
  getDefaultValue(config) {
    return typeof config.defaultValue === "number" ? config.defaultValue : null;
  },
  normalizeValue(value) {
    if (value === null || value === undefined) {
      return null;
    }
    const parsed = typeof value === "number" ? value : Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  },
  validateConfig(config, context) {
    if ((config.min ?? 1) > config.max) {
      context.fail(builtinValidationMessages.invalidNumericRange, ["min"]);
    }
  },
  validateSync(value, config, context) {
    if (value === null) {
      return [];
    }

    const errors: string[] = [];
    const min = config.min ?? 1;
    const max = config.max;

    if (value < min) {
      errors.push(builtinMessage(context?.formatMessage, "minValue", min));
    }
    if (value > max) {
      errors.push(builtinMessage(context?.formatMessage, "maxValue", max));
    }
    if (config.step !== undefined) {
      const difference = Math.abs(value - min);
      const remainder = difference % config.step;
      const tolerance = config.step * 1e-9;
      if (remainder > tolerance && Math.abs(remainder - config.step) > tolerance) {
        errors.push(builtinMessage(context?.formatMessage, "stepValue", config.step, min));
      }
    }

    return errors;
  },
};
