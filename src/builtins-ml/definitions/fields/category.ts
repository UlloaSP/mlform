// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import * as z from "zod";
import { builtinValidationMessages } from "../../constants";
import type { BaseFieldConfig, NormalizedFieldConfig } from "@/schema";
import {
  baseFieldShape,
  makeFieldDescriptor,
  optionSchema,
  type BuiltinFieldDefinition,
} from "../shared";

type CategoryOption = string | { label: string; value: string };

type CategoryFieldConfig = BaseFieldConfig & {
  kind: "category";
  options: CategoryOption[];
};

export const categoryFieldDefinition: BuiltinFieldDefinition<CategoryFieldConfig, string | null> = {
  kind: "category",
  schema: z.object({
    kind: z.literal("category"),
    ...baseFieldShape,
    options: z.array(optionSchema).min(1),
  }),
  getDefaultValue(config) {
    return typeof config.defaultValue === "string" ? config.defaultValue : null;
  },
  normalizeValue(value) {
    if (value === null || value === undefined || value === "") {
      return null;
    }
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean" ||
      typeof value === "bigint"
    ) {
      return `${value}`;
    }
    return null;
  },
  validate(value, config) {
    if (value === null) {
      return [];
    }

    const allowedValues = config.options.map((option: CategoryOption) =>
      typeof option === "string" ? option : option.value,
    );

    return allowedValues.includes(value) ? [] : [builtinValidationMessages.categoryOptionMismatch];
  },
  describe(config, context) {
    return makeFieldDescriptor(
      "category-field",
      config as NormalizedFieldConfig<CategoryFieldConfig>,
      {
        value: context.state.value,
        options: config.options,
        state: context.state.status,
        errors: context.state.errors,
      },
    );
  },
};
