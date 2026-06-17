// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import * as z from "zod";
import { builtinValidationMessages } from "../../constants";
import type { BaseFieldConfig, MappedTo, NormalizedFieldConfig } from "@/schema";
import {
  baseFieldShape,
  makeFieldDescriptor,
  mappedToSchema,
  type BuiltinFieldDefinition,
} from "../shared";

export type OneHotCategoryOption = {
  label: string;
  value: string;
  mappedTo: MappedTo;
};

export type OneHotCategoryFieldConfig = BaseFieldConfig & {
  kind: "onehot-category";
  options: OneHotCategoryOption[];
};

const oneHotCategoryOptionSchema = z.object({
  label: z.string(),
  value: z.string(),
  mappedTo: mappedToSchema.unwrap(),
});

export const oneHotCategoryFieldDefinition: BuiltinFieldDefinition<
  OneHotCategoryFieldConfig,
  string | null
> = {
  kind: "onehot-category",
  schema: z.object({
    kind: z.literal("onehot-category"),
    ...baseFieldShape,
    includeInSubmission: z.boolean().optional().default(true),
    options: z.array(oneHotCategoryOptionSchema).min(1),
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

    return config.options.some((option) => option.value === value)
      ? []
      : [builtinValidationMessages.categoryOptionMismatch];
  },
  describe(config, context) {
    return makeFieldDescriptor(
      "category-field",
      config as NormalizedFieldConfig<OneHotCategoryFieldConfig>,
      {
        value: context.state.value,
        options: config.options.map((option) => ({ label: option.label, value: option.value })),
        state: context.state.status,
        errors: context.state.errors,
      },
    );
  },
};
