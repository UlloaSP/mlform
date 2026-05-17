// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import * as z from "zod";
import { builtinValidationMessages } from "@/runtime/constants";
import type { BaseFieldConfig, NormalizedFieldConfig } from "@/schema";
import {
  baseFieldShape,
  makeFieldDescriptor,
  optionSchema,
  type BuiltinFieldDefinition,
} from "../shared";

type MultiChoiceOption = string | { label: string; value: string };

type MultiChoiceFieldConfig = BaseFieldConfig & {
  kind: "multi-choice";
  options: MultiChoiceOption[];
  layout?: "horizontal" | "vertical";
};

export const multiChoiceFieldDefinition: BuiltinFieldDefinition<MultiChoiceFieldConfig, string[]> =
  {
    kind: "multi-choice",
    schema: z.object({
      kind: z.literal("multi-choice"),
      ...baseFieldShape,
      options: z.array(optionSchema).min(1),
      layout: z.enum(["horizontal", "vertical"]).optional(),
    }),
    getDefaultValue(config) {
      if (Array.isArray(config.defaultValue)) {
        return (config.defaultValue as unknown[]).filter((v) => typeof v === "string").map(String);
      }
      return [];
    },
    normalizeValue(value) {
      if (!Array.isArray(value)) {
        return [];
      }
      return value
        .filter(
          (v) =>
            typeof v === "string" ||
            typeof v === "number" ||
            typeof v === "boolean" ||
            typeof v === "bigint",
        )
        .map(String);
    },
    cloneValue(value) {
      return [...value];
    },
    isEqual(previous, next) {
      if (previous.length !== next.length) return false;
      return previous.every((v, i) => v === next[i]);
    },
    validate(value, config) {
      if (value.length === 0) {
        return [];
      }

      const allowedValues = config.options.map((option: MultiChoiceOption) =>
        typeof option === "string" ? option : option.value,
      );

      const invalid = value.filter((v) => !allowedValues.includes(v));
      return invalid.length > 0 ? [builtinValidationMessages.categoryOptionMismatch] : [];
    },
    describe(config, context) {
      return makeFieldDescriptor(
        "multi-choice-field",
        config as NormalizedFieldConfig<MultiChoiceFieldConfig>,
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
