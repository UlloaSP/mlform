// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import * as z from "zod";
import { builtinValidationMessages } from "../../constants";
import type { BaseFieldConfig, FieldDefinition, NormalizedFieldConfig } from "../../types";
import { baseFieldShape, makeFieldDescriptor } from "../shared";

type MappedCategoryOption = {
  label: string;
  value: string;
  mapping: Record<string, unknown>;
};

type MappedCategoryFieldConfig = BaseFieldConfig & {
  kind: "mapped-category";
  options: MappedCategoryOption[];
};

const mappedCategoryOptionSchema = z.object({
  label: z.string(),
  value: z.string(),
  mapping: z.record(z.string(), z.unknown()),
});

export const mappedCategoryFieldDefinition: FieldDefinition<
  MappedCategoryFieldConfig,
  string | null
> = {
  kind: "mapped-category",
  schema: z.object({
    kind: z.literal("mapped-category"),
    ...baseFieldShape,
    options: z.array(mappedCategoryOptionSchema).min(1),
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

    const allowedValues = config.options.map((option) => option.value);

    return allowedValues.includes(value) ? [] : [builtinValidationMessages.categoryOptionMismatch];
  },
  describe(config, context) {
    return makeFieldDescriptor(
      "category-field",
      config as NormalizedFieldConfig<MappedCategoryFieldConfig>,
      {
        value: context.state.value,
        options: config.options.map((opt) => ({ label: opt.label, value: opt.value })),
        state: context.state.status,
        errors: context.state.errors,
      },
    );
  },
};
