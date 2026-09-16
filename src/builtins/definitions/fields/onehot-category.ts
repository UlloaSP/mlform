// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import * as z from "zod";
import { builtinValidationMessages } from "../../constants";
import { mappedToKey, resolveMappedTargets, type BaseFieldConfig, type MappedTo } from "@/schema";
import { baseFieldShape, mappedToSchema, type BuiltinFieldDefinition } from "../shared";

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
  validateSync(value, config) {
    if (value === null) {
      return [];
    }

    return config.options.some((option) => option.value === value)
      ? []
      : [builtinValidationMessages.categoryOptionMismatch];
  },
  getMappedTargets(config, context) {
    return config.options.flatMap((option) =>
      resolveMappedTargets(option.mappedTo, context.backend),
    );
  },
  getSubmissionEntries(value, _serializedValue, config, context) {
    const seen = new Set<string>();
    const entries: { target: string | number; value: number }[] = [];

    for (const option of config.options) {
      const targets = resolveMappedTargets(option.mappedTo, context.backend);
      if (targets.length === 0) {
        throw new Error(
          `onehot-category "${config.id}": option "${option.value}" has no mappedTo.`,
        );
      }
      for (const target of targets) {
        const key = mappedToKey(target);
        if (seen.has(key)) {
          throw new Error(`onehot-category "${config.id}": duplicate mappedTo "${key}".`);
        }
        seen.add(key);
        entries.push({ target, value: value === option.value ? 1 : 0 });
      }
    }

    return entries;
  },
};
