// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { Registry } from "@/schema";
import type { InternalFieldController } from "./fields";
import type { RuntimeBehavior } from "./types";

export const createDefinitionBehaviors = (
  fields: readonly InternalFieldController[],
  registry: Registry,
): RuntimeBehavior[] =>
  fields.flatMap((field): RuntimeBehavior[] => {
    const definition = registry.getField(field.kind);
    if (!definition?.validateRuntime && !definition?.onValueChanged) return [];

    return [
      {
        validate(context) {
          definition.validateRuntime?.(field.config, context);
        },
        onValuesChanged(event, context) {
          if (event.fieldId !== field.id) return;
          return definition.onValueChanged?.(
            event.values[field.id] as never,
            field.config,
            context,
          );
        },
      },
    ];
  });
