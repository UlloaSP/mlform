// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import {
  builtinFieldDefinitions,
  builtinReportDefinitions,
  createMappedCategoryBehavior,
} from "@/builtins";
import { createPrimitiveDescriptorRegistry, type PrimitiveDescriptorRegistry } from "@/primitives";
import type { RuntimeBehavior } from "@/runtime";
import { createRegistry, type Registry } from "@/schema";
import { cloneSchemaRegistry } from "./defaults";
import { defineMlformPlugin, type MlformPlugin } from "./plugin";

export interface KitRegistryPack {
  registry: Registry;
  descriptorRegistry: PrimitiveDescriptorRegistry;
  behaviors: RuntimeBehavior[];
}

export interface ResolveKitRegistryPackOptions {
  registry?: Registry;
  descriptorRegistry?: PrimitiveDescriptorRegistry;
  behaviors?: RuntimeBehavior[];
  plugins?: readonly MlformPlugin[];
}

const createBuiltinPlugin = (): MlformPlugin =>
  defineMlformPlugin({
    fields: builtinFieldDefinitions.map((definition) => ({
      category: "field" as const,
      kind: definition.kind,
      register(registry, descriptorRegistry) {
        registry.registerField(definition as never);
        descriptorRegistry.registerField({
          kind: definition.kind,
          describe: definition.describe as never,
        });
      },
    })),
    reports: builtinReportDefinitions.map((definition) => ({
      category: "report" as const,
      kind: definition.kind,
      register(registry, descriptorRegistry) {
        registry.registerReport(definition as never);
        descriptorRegistry.registerReport({
          kind: definition.kind,
          describe: definition.describe as never,
        });
      },
    })),
    behaviors: [createMappedCategoryBehavior()],
  });

const applyPlugin = (pack: KitRegistryPack, plugin: MlformPlugin): void => {
  for (const field of plugin.fields ?? []) {
    field.register(pack.registry, pack.descriptorRegistry);
  }

  for (const report of plugin.reports ?? []) {
    report.register(pack.registry, pack.descriptorRegistry);
  }

  pack.behaviors.push(...(plugin.behaviors ?? []));
};

const createDefaultRegistryPack = (): KitRegistryPack => {
  const pack: KitRegistryPack = {
    registry: createRegistry(),
    descriptorRegistry: createPrimitiveDescriptorRegistry(),
    behaviors: [],
  };
  applyPlugin(pack, createBuiltinPlugin());
  return pack;
};

export const resolveKitRegistryPack = (options: ResolveKitRegistryPackOptions): KitRegistryPack => {
  const defaults = createDefaultRegistryPack();
  const pack: KitRegistryPack = {
    registry: options.registry ? cloneSchemaRegistry(options.registry) : defaults.registry,
    descriptorRegistry: options.descriptorRegistry?.clone() ?? defaults.descriptorRegistry,
    behaviors: options.behaviors ? [...options.behaviors] : defaults.behaviors,
  };

  for (const plugin of options.plugins ?? []) applyPlugin(pack, plugin);
  return pack;
};
