// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { builtinDesignSystemRegistry } from "../registry";
import { deepFreeze } from "../registry/deep-freeze";
import { mergeDesignSystemConfig } from "../resolve";
import { DesignSystemController } from "./design-system-controller";
import type { AttachDesignSystemOptions, AttachedDesignSystem, DesignSystemConfig } from "../types";

/**
 * Attach a design system to a host element.
 *
 * **DOM required.** This function accesses `HTMLElement`, `MutationObserver`,
 * and `window.matchMedia` and must run in a browser environment. It is not
 * suitable for SSR / Node.js contexts. Use `resolveDesignSystem` directly for
 * server-side token resolution without DOM side effects.
 */
export const createAttachedDesignSystem = (
  host: HTMLElement,
  options: AttachDesignSystemOptions = {},
  hydrate = false,
): AttachedDesignSystem => {
  const freezeConfig = (...configs: Array<DesignSystemConfig | undefined>): DesignSystemConfig =>
    deepFreeze(mergeDesignSystemConfig(...configs));

  const initialConfig = freezeConfig(options.config);
  let currentConfig = initialConfig;
  const registry = options.registry?.clone() ?? builtinDesignSystemRegistry.clone();
  const controller = new DesignSystemController({
    host,
    registry,
    getConfig: () => currentConfig,
    onChange: options.onChange,
    hydrate,
    transition: options.transition,
  });

  controller.connect();

  return Object.freeze({
    host,
    registry,
    get config() {
      return currentConfig;
    },
    get resolved() {
      return controller.resolved;
    },
    update(config: DesignSystemConfig) {
      currentConfig = freezeConfig(currentConfig, config);
      controller.refresh();
    },
    replace(config: DesignSystemConfig) {
      currentConfig = freezeConfig(config);
      controller.refresh();
    },
    reset() {
      currentConfig = initialConfig;
      controller.refresh();
    },
    disconnect() {
      controller.disconnect();
    },
  });
};

export const attachDesignSystem = (
  host: HTMLElement,
  options: AttachDesignSystemOptions = {},
): AttachedDesignSystem => {
  return createAttachedDesignSystem(host, options);
};
