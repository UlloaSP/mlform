// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import * as z from "zod";
import { builtinValidationMessages } from "../../constants";
import { normalizeSchemaId, type BaseFieldConfig } from "@/schema";
import { baseFieldShape, type BuiltinFieldDefinition } from "../shared";

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

export const mappedCategoryFieldDefinition: BuiltinFieldDefinition<
  MappedCategoryFieldConfig,
  string | null
> = {
  kind: "mapped-category",
  schema: z.object({
    kind: z.literal("mapped-category"),
    ...baseFieldShape,
    includeInSubmission: z.boolean().optional().default(false),
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
  validateSync(value, config) {
    if (value === null) {
      return [];
    }

    const allowedValues = config.options.map((option) => option.value);

    return allowedValues.includes(value) ? [] : [builtinValidationMessages.categoryOptionMismatch];
  },
  validateRuntime(config, context) {
    for (const option of config.options) {
      for (const targetId of Object.keys(option.mapping)) {
        const target = context.getField(targetId) ?? context.getField(normalizeSchemaId(targetId));
        if (!target) {
          throw new Error(
            `mapped-category "${config.id}": mapping references unknown field "${targetId}".`,
          );
        }
      }
    }
  },
  onValueChanged(value, config, context) {
    const selected = config.options.find((option) => option.value === value);
    if (!selected) return;

    for (const [targetId, targetValue] of Object.entries(selected.mapping)) {
      const target = context.getField(targetId) ?? context.getField(normalizeSchemaId(targetId));
      if (!target) {
        throw new Error(
          `mapped-category "${config.id}": target field "${targetId}" not found in schema.`,
        );
      }
      context.commitDerivedValue(target.id, targetValue);
    }
    context.syncDerivedState();
  },
};
