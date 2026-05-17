// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import * as z from "zod";
import { builtinValidationMessages } from "@/runtime/constants";
import type { BaseFieldConfig, NormalizedFieldConfig } from "@/schema";
import { baseFieldShape, makeFieldDescriptor, type BuiltinFieldDefinition } from "../shared";

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
  validate(value, config) {
    if (value === null) {
      return [];
    }

    const errors: string[] = [];
    const min = config.min ?? 1;
    const max = config.max;

    if (min > max) {
      errors.push(builtinValidationMessages.invalidNumericRange);
      return errors;
    }

    if (value < min) {
      errors.push(builtinValidationMessages.minValue(min));
    }
    if (value > max) {
      errors.push(builtinValidationMessages.maxValue(max));
    }

    return errors;
  },
  describe(config, context) {
    return makeFieldDescriptor("rating-field", config as NormalizedFieldConfig<RatingFieldConfig>, {
      value: context.state.value,
      min: config.min ?? 1,
      max: config.max,
      step: config.step ?? 1,
      state: context.state.status,
      errors: context.state.errors,
    });
  },
};
