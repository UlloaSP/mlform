// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { normalizeSchemaId } from "@/schema";
import type {
  FieldHandle,
  RuntimeBehavior,
  RuntimeBehaviorContext,
  RuntimeBehaviorValueChangeEvent,
} from "@/runtime";

type MappedCategoryOption = {
  label: string;
  value: string;
  mapping: Record<string, unknown>;
};

type MappedCategoryConfig = {
  options: MappedCategoryOption[];
};

const asMappedCategoryConfig = (field: FieldHandle): MappedCategoryConfig | null => {
  return field.kind === "mapped-category"
    ? (field.config as unknown as MappedCategoryConfig)
    : null;
};

const resolveMappedField = (
  context: RuntimeBehaviorContext,
  targetId: string,
): FieldHandle | undefined => {
  return context.getField(targetId) ?? context.getField(normalizeSchemaId(targetId));
};

const applyMappedCategoryUpdate = async (
  event: RuntimeBehaviorValueChangeEvent,
  context: RuntimeBehaviorContext,
): Promise<void> => {
  const field = context.getField(event.fieldId);
  if (!field) {
    return;
  }

  const config = asMappedCategoryConfig(field);
  if (!config) {
    return;
  }

  const selectedValue = event.values[event.fieldId];
  const selectedOption = config.options.find((option) => option.value === selectedValue);
  if (!selectedOption?.mapping) {
    return;
  }

  for (const [targetId, targetValue] of Object.entries(selectedOption.mapping)) {
    const targetField = resolveMappedField(context, targetId);
    if (!targetField) {
      throw new Error(
        `mapped-category "${event.fieldId}": target field "${targetId}" not found in schema.`,
      );
    }

    context.commitDerivedValue(targetField.id, targetValue);
  }

  context.syncDerivedState();
};

export const createMappedCategoryBehavior = (): RuntimeBehavior => ({
  validate(context) {
    for (const field of context.fields) {
      const config = asMappedCategoryConfig(field);
      if (!config) {
        continue;
      }

      for (const option of config.options) {
        for (const targetId of Object.keys(option.mapping ?? {})) {
          if (!resolveMappedField(context, targetId)) {
            throw new Error(
              `mapped-category "${field.id}": mapping references unknown field "${targetId}".`,
            );
          }
        }
      }
    }
  },
  async onValuesChanged(event, context) {
    await applyMappedCategoryUpdate(event, context);
  },
});
