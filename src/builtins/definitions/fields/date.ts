// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import * as z from "zod";
import { builtinValidationMessages } from "../../constants";
import type { BaseFieldConfig } from "@/schema";
import { baseFieldShape, type BuiltinFieldDefinition } from "../shared";
import { toDate } from "./value-helpers";

type DateFieldConfig = BaseFieldConfig & {
  kind: "date";
  min?: string;
  max?: string;
  step?: number;
};

export const dateFieldDefinition: BuiltinFieldDefinition<DateFieldConfig, Date | null> = {
  kind: "date",
  schema: z.object({
    kind: z.literal("date"),
    ...baseFieldShape,
    min: z.string().optional(),
    max: z.string().optional(),
    step: z.number().positive().optional(),
  }),
  getDefaultValue(config) {
    return toDate(config.defaultValue) ?? null;
  },
  normalizeValue(value) {
    return toDate(value);
  },
  serializeValue(value) {
    return value instanceof Date ? value.toISOString() : value;
  },
  validate(value, config) {
    const errors: string[] = [];
    const minDate = toDate(config.min);
    const maxDate = toDate(config.max);

    if (minDate && maxDate && minDate.getTime() > maxDate.getTime()) {
      errors.push(builtinValidationMessages.invalidDateRange);
    }

    if (value === null) {
      return errors;
    }

    if (minDate && value.getTime() < minDate.getTime()) {
      errors.push(builtinValidationMessages.dateOnOrAfter(String(config.min)));
    }
    if (maxDate && value.getTime() > maxDate.getTime()) {
      errors.push(builtinValidationMessages.dateOnOrBefore(String(config.max)));
    }
    if (config.step !== undefined) {
      const stepBase = minDate ?? new Date("1970-01-01T00:00:00Z");
      const diffDays = Math.round(Math.abs(value.getTime() - stepBase.getTime()) / 86400000);
      if (diffDays % config.step !== 0) {
        errors.push(builtinValidationMessages.stepDate(config.step));
      }
    }

    return errors;
  },
};
