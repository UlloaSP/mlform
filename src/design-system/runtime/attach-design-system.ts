// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { builtinDesignSystemRegistry } from "../registry";
import { mergeDesignSystemConfig } from "../resolve";
import { DesignSystemController } from "./design-system-controller";
import type { AttachDesignSystemOptions, AttachedDesignSystem, DesignSystemConfig } from "../types";

export const attachDesignSystem = (
  host: HTMLElement,
  options: AttachDesignSystemOptions = {},
): AttachedDesignSystem => {
  const initialConfig = mergeDesignSystemConfig(options.config);
  let currentConfig: DesignSystemConfig = mergeDesignSystemConfig(initialConfig);
  const registry = options.registry?.clone() ?? builtinDesignSystemRegistry.clone();
  const controller = new DesignSystemController({
    host,
    registry,
    getConfig: () => currentConfig,
    onChange: options.onChange,
  });

  controller.connect();

  return {
    host,
    registry,
    get config() {
      return mergeDesignSystemConfig(currentConfig);
    },
    get resolved() {
      return controller.resolved;
    },
    update(config) {
      currentConfig = mergeDesignSystemConfig(currentConfig, config);
      controller.refresh();
    },
    replace(config) {
      currentConfig = mergeDesignSystemConfig(config);
      controller.refresh();
    },
    reset() {
      currentConfig = mergeDesignSystemConfig(initialConfig);
      controller.refresh();
    },
    disconnect() {
      controller.disconnect();
    },
  };
};
