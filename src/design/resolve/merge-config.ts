// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { ComponentKey } from "../contract";
import type { DesignSystemConfig, DesignSystemOverrides } from "../types";

const mergeOverrides = (
  left: DesignSystemOverrides | undefined,
  right: DesignSystemOverrides | undefined,
): DesignSystemOverrides | undefined => {
  if (!left && !right) {
    return undefined;
  }

  const componentEntries = new Map<ComponentKey, { tokens?: Record<string, string> }>();

  for (const source of [left?.components, right?.components]) {
    if (!source) {
      continue;
    }

    for (const [key, component] of Object.entries(source) as Array<
      [ComponentKey, { tokens?: Record<string, string> } | undefined]
    >) {
      if (!component) {
        continue;
      }

      componentEntries.set(key, {
        tokens: {
          ...componentEntries.get(key)?.tokens,
          ...component.tokens,
        },
      });
    }
  }

  return {
    density: right?.density ?? left?.density,
    motion: right?.motion ?? left?.motion,
    tokens: {
      ...left?.tokens,
      ...right?.tokens,
    },
    components:
      componentEntries.size > 0
        ? (Object.fromEntries(componentEntries) as Partial<
            Record<ComponentKey, { tokens?: Record<string, string> }>
          >)
        : undefined,
  };
};

export const mergeDesignSystemConfig = (
  ...configs: Array<DesignSystemConfig | undefined>
): DesignSystemConfig => {
  return configs.reduce<DesignSystemConfig>(
    (accumulator, current) => ({
      mode: current?.mode ?? accumulator.mode,
      theme: current?.theme ?? accumulator.theme,
      recipe: current?.recipe ?? accumulator.recipe,
      variant: current?.variant ?? accumulator.variant,
      hostSchemeResolver: current?.hostSchemeResolver ?? accumulator.hostSchemeResolver,
      strict: current?.strict ?? accumulator.strict,
      onWarning: current?.onWarning ?? accumulator.onWarning,
      overrides: mergeOverrides(accumulator.overrides, current?.overrides),
    }),
    {},
  );
};
