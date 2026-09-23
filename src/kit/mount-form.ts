// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { attachDesignSystem, type DesignSystemConfig, type ResolvedDesignSystem } from "@/design";
import { createFormView, flattenLayoutNodes } from "@/view";
import { kitErrorMessages } from "./constants";
import {
  resolveDesignSystemRegistry,
  resolveKitDesignSystem,
  resolveKitLabels,
  resolvePrimitiveRegistry,
} from "./defaults";
import type { KitDesignSystemSnapshot, MountFormOptions, MountedForm } from "./mount-types";
import { bindDocumentLifecycle } from "./document-lifecycle";
import { captureHostContent, restoreHostContent } from "./host-container";
import { createLayoutHost } from "./layout-host";
import { mountSinglePageForm } from "./single-page/mount";

const mountedFormRef = Symbol("mlform.kit.mounted");

type KitContainer = HTMLElement & {
  [mountedFormRef]?: { mounted: MountedForm; originalContent: readonly Node[] };
};

const runCleanup = (steps: readonly (() => void)[]): unknown[] => {
  const errors: unknown[] = [];
  for (const step of steps) {
    try {
      step();
    } catch (error) {
      errors.push(error);
    }
  }
  return errors;
};

const throwCleanupErrors = (errors: readonly unknown[]): void => {
  if (errors.length === 1) throw errors[0];
  if (errors.length > 1) throw new AggregateError(errors, "Form cleanup failed.");
};

const assertDesignSystemSnapshot: (
  config: KitDesignSystemSnapshot | DesignSystemConfig,
) => asserts config is KitDesignSystemSnapshot = (config) => {
  if (!config.mode || !config.theme || !config.recipe) {
    throw new TypeError(kitErrorMessages.invalidDesignSystemSnapshot);
  }
};

const hasLayoutChildren = (options: MountFormOptions): boolean => {
  const layout = options.layout;
  return Boolean(layout && "children" in layout && layout.children && layout.children.length > 0);
};

export const mountForm = (container: HTMLElement, options: MountFormOptions): MountedForm => {
  const hostContainer = container as KitContainer;
  const primitiveRegistry = resolvePrimitiveRegistry(options.primitiveRegistry);
  const designSystemRegistry = resolveDesignSystemRegistry(options.designSystemRegistry);
  const labels = resolveKitLabels(options.labels);
  const initialDesignSystem = resolveKitDesignSystem(options.designSystem);

  const shouldUsePrimitive =
    !options.layout ||
    ((options.layout.kind === undefined ||
      options.layout.kind === "stacked" ||
      options.layout.kind === "split") &&
      !hasLayoutChildren(options));
  const previousMount = hostContainer[mountedFormRef];
  const originalContent = captureHostContent(
    container,
    options.containerStrategy,
    previousMount?.mounted.host,
    previousMount?.originalContent,
  );
  const view = createFormView(options);
  const stagingContainer = container.ownerDocument.createElement("div");
  let unmountHost = (): void => {};
  let host!: HTMLElement;
  let designSystem: ReturnType<typeof attachDesignSystem> | undefined;
  let disconnectHostLifecycle = (): void => {};
  let pendingDesignChange: ResolvedDesignSystem | undefined;
  let committed = false;
  try {
    const customNode = flattenLayoutNodes(view.getSnapshot().layout).find(
      (node) => node.kind === "custom",
    );
    if (customNode?.kind === "custom") {
      throw new TypeError(kitErrorMessages.customRegionRequiresHost(customNode.id));
    }
    if (shouldUsePrimitive) {
      const mountedPrimitive = mountSinglePageForm(
        stagingContainer,
        view,
        options,
        primitiveRegistry,
        labels,
      );
      host = mountedPrimitive.host;
      unmountHost = () => mountedPrimitive.unmount();
    } else {
      host = createLayoutHost({
        ownerDocument: container.ownerDocument,
        options,
        registry: primitiveRegistry,
        labels,
        view,
      });
      stagingContainer.append(host);
      unmountHost = () => host.remove();
    }

    container.append(host);
    designSystem = attachDesignSystem(host, {
      config: initialDesignSystem,
      registry: designSystemRegistry,
      onChange: options.onDesignSystemChange
        ? (resolved) => {
            if (committed) options.onDesignSystemChange?.(resolved);
            else pendingDesignChange = resolved;
          }
        : undefined,
    });
    if (options.hostLifecycle === "document") {
      disconnectHostLifecycle = bindDocumentLifecycle(view.form, container.ownerDocument);
    }
    if (pendingDesignChange) options.onDesignSystemChange?.(pendingDesignChange);
  } catch (error) {
    const cleanupErrors = runCleanup([
      disconnectHostLifecycle,
      () => designSystem?.disconnect(),
      unmountHost,
      () => host?.remove(),
      () => view.dispose(),
    ]);
    if (cleanupErrors.length > 0) {
      throw new AggregateError([error, ...cleanupErrors], "Form setup and cleanup failed.");
    }
    throw error;
  }

  let unmounted = false;

  const mounted: MountedForm = Object.freeze({
    form: view.form,
    host,
    engineRegistry: view.engineRegistry,
    descriptorRegistry: view.descriptorRegistry,
    primitiveRegistry,
    designSystemRegistry,
    designSystem,
    submit(options?: Parameters<MountedForm["submit"]>[0]) {
      return view.submit(options);
    },
    updateDesignSystem(config: DesignSystemConfig) {
      designSystem.update(config);
    },
    replaceDesignSystem(config: KitDesignSystemSnapshot) {
      assertDesignSystemSnapshot(config);
      designSystem.replace(config);
    },
    resetDesignSystem() {
      designSystem.reset();
    },
    suspend(reason?: string) {
      view.suspend(reason);
    },
    resume() {
      view.resume();
    },
    unmount() {
      if (unmounted) {
        return;
      }

      unmounted = true;

      if (hostContainer[mountedFormRef]?.mounted === mounted) {
        delete hostContainer[mountedFormRef];
      }

      throwCleanupErrors(
        runCleanup([
          disconnectHostLifecycle,
          () => view.dispose(),
          () => designSystem.disconnect(),
          unmountHost,
          () => restoreHostContent(container, originalContent),
        ]),
      );
    },
  });

  try {
    previousMount?.mounted.unmount();
    container.replaceChildren(host);
  } catch (error) {
    mounted.unmount();
    throw error;
  }
  hostContainer[mountedFormRef] = { mounted, originalContent };
  committed = true;

  return mounted;
};

export const unmountForm = (mounted: MountedForm): void => {
  mounted.unmount();
};
