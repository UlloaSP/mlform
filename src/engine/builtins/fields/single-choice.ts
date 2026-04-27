// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import * as z from "zod";
import { builtinValidationMessages } from "../../constants";
import type { BaseFieldConfig, FieldDefinition, NormalizedFieldConfig } from "../../types";
import { baseFieldShape, makeFieldDescriptor, optionSchema } from "../shared";

type SingleChoiceOption = string | { label: string; value: string };

type SingleChoiceFieldConfig = BaseFieldConfig & {
  kind: "single-choice";
  options: SingleChoiceOption[];
  layout?: "horizontal" | "vertical";
};

export const singleChoiceFieldDefinition: FieldDefinition<SingleChoiceFieldConfig, string | null> =
  {
    kind: "single-choice",
    schema: z.object({
      kind: z.literal("single-choice"),
      ...baseFieldShape,
      options: z.array(optionSchema).min(1),
      layout: z.enum(["horizontal", "vertical"]).optional(),
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

      const allowedValues = config.options.map((option: SingleChoiceOption) =>
        typeof option === "string" ? option : option.value,
      );

      return allowedValues.includes(value)
        ? []
        : [builtinValidationMessages.categoryOptionMismatch];
    },
    describe(config, context) {
      return makeFieldDescriptor(
        "single-choice-field",
        config as NormalizedFieldConfig<SingleChoiceFieldConfig>,
        {
          value: context.state.value,
          options: config.options,
          layout: config.layout ?? "vertical",
          state: context.state.status,
          errors: context.state.errors,
        },
      );
    },
  };
