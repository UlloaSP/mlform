// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { AttachDesignSystemOptions, AttachedDesignSystem } from "../types";
import { createAttachedDesignSystem } from "./attach-design";

/**
 * Hydrate a server-rendered design system onto a host element.
 *
 * Call this on the client after the server has rendered a `<style>` block
 * (via `createDesignSystemStylesheet`) and set `data-mlf-*` attributes on
 * the host. The controller attaches, reads the current DOM state, and takes
 * over reactivity (media queries, inherited scheme, config updates) without
 * a visible flash — the SSR tokens are already applied.
 *
 * Usage:
 * ```ts
 * // Server: resolve + render stylesheet into <head> or shadow root
 * const resolved = resolveDesignSystem(config, registry, { systemScheme: "light" });
 * const css = createDesignSystemStylesheet(resolved, { selector: "#form-host" });
 * const attrs = getResolvedDesignSystemHostAttributes(resolved);
 *
 * // Client: hydrate — controller picks up where SSR left off
 * const ds = hydrateDesignSystem(document.getElementById("form-host")!, {
 *   config,
 *   registry,
 * });
 * ```
 */
export const hydrateDesignSystem = (
  host: HTMLElement,
  options: AttachDesignSystemOptions = {},
): AttachedDesignSystem => {
  return createAttachedDesignSystem(host, options, true);
};
