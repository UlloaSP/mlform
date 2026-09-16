// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { createBuiltinMlRegistry } from "@/builtins";
import type { PrimitiveDescriptorRegistry } from "@/primitives";
import type { RuntimeBehavior } from "@/runtime";
import type { Registry } from "@/schema";
import { createBuiltinDescriptorRegistry } from "./builtin-presenters";
import { cloneSchemaRegistry } from "./defaults";
import type { MLFormPlugin } from "./plugin";

export interface KitRegistryPack {
  registry: Registry;
  descriptorRegistry: PrimitiveDescriptorRegistry;
  behaviors: RuntimeBehavior[];
}

export interface ResolveKitRegistryPackOptions {
  registry?: Registry;
  descriptorRegistry?: PrimitiveDescriptorRegistry;
  behaviors?: RuntimeBehavior[];
  plugins?: readonly MLFormPlugin[];
}

const applyPlugin = (pack: KitRegistryPack, plugin: MLFormPlugin): void => {
  for (const field of plugin.fields ?? []) {
    field.register(pack.registry, pack.descriptorRegistry);
  }

  for (const report of plugin.reports ?? []) {
    report.register(pack.registry, pack.descriptorRegistry);
  }

  pack.behaviors.push(...(plugin.behaviors ?? []));
};

const createDefaultRegistryPack = (): KitRegistryPack => {
  return {
    registry: createBuiltinMlRegistry(),
    descriptorRegistry: createBuiltinDescriptorRegistry(),
    behaviors: [],
  };
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
