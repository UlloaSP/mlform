// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { builtinDesignSystemRegistry } from "../registry";
import { deepFreeze } from "../registry/deep-freeze";
import { mergeDesignSystemConfig } from "../resolve";
import { DesignSystemController } from "./design-controller";
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

  try {
    controller.connect();
  } catch (error) {
    controller.disconnect();
    throw error;
  }

  const applyConfig = (nextConfig: DesignSystemConfig): void => {
    const previousConfig = currentConfig;
    currentConfig = nextConfig;
    try {
      controller.refresh();
    } catch (error) {
      currentConfig = previousConfig;
      try {
        controller.refresh();
      } catch {
        // Preserve the error from the rejected update.
      }
      throw error;
    }
  };

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
      applyConfig(freezeConfig(currentConfig, config));
    },
    replace(config: DesignSystemConfig) {
      applyConfig(freezeConfig(config));
    },
    reset() {
      applyConfig(initialConfig);
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
