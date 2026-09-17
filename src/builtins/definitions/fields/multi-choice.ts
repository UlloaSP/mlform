// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import * as z from "zod";
import { builtinValidationMessages } from "../../constants";
import type { BaseFieldConfig } from "@/schema";
import { baseFieldShape, optionSchema, type BuiltinFieldDefinition } from "../shared";

type MultiChoiceOption = string | { label: string; value: string };

type MultiChoiceFieldConfig = BaseFieldConfig & {
  kind: "multi-choice";
  options: MultiChoiceOption[];
  layout?: "horizontal" | "vertical";
};

const normalizeChoices = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return [
    ...new Set(
      value
        .filter(
          (item) =>
            typeof item === "string" ||
            typeof item === "number" ||
            typeof item === "boolean" ||
            typeof item === "bigint",
        )
        .map(String),
    ),
  ];
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
      return normalizeChoices(config.defaultValue);
    },
    normalizeValue(value) {
      return normalizeChoices(value);
    },
    cloneValue(value) {
      return [...value];
    },
    isEqual(previous, next) {
      if (previous.length !== next.length) return false;
      return previous.every((v, i) => v === next[i]);
    },
    validateSync(value, config) {
      if (value.length === 0) {
        return [];
      }

      const allowedValues = config.options.map((option: MultiChoiceOption) =>
        typeof option === "string" ? option : option.value,
      );

      const invalid = value.filter((v) => !allowedValues.includes(v));
      return invalid.length > 0 ? [builtinValidationMessages.categoryOptionMismatch] : [];
    },
  };
