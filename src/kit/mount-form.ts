// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { attachDesignSystem, type DesignSystemConfig } from "@/design-system";
import { mountForm as mountPrimitiveForm } from "@/primitives";
import { kitErrorMessages } from "./constants";
import {
  resolveDesignSystemRegistry,
  resolveKitDesignSystem,
  resolveKitLabels,
  resolvePrimitiveRegistry,
} from "./defaults";
import type { KitDesignSystemSnapshot, MountFormOptions, MountedForm } from "./types";
import { createFormView } from "./view";

const mountedFormRef = Symbol("mlform.kit.mounted");

type KitContainer = HTMLElement & {
  [mountedFormRef]?: MountedForm;
};

const assertDesignSystemSnapshot: (
  config: KitDesignSystemSnapshot | DesignSystemConfig,
) => asserts config is KitDesignSystemSnapshot = (config) => {
  if (!config.mode || !config.theme || !config.recipe) {
    throw new TypeError(kitErrorMessages.invalidDesignSystemSnapshot);
  }
};

export const mountForm = (container: HTMLElement, options: MountFormOptions): MountedForm => {
  const hostContainer = container as KitContainer;
  hostContainer[mountedFormRef]?.unmount();

  const view = createFormView({
    schema: options.schema,
    transport: options.transport,
    registry: options.registry,
    presentationRegistry: options.presentationRegistry,
    initialValues: options.initialValues,
    validators: options.validators,
    hooks: options.hooks,
    hookFailurePolicy: options.hookFailurePolicy,
    inactiveFieldPolicy: options.inactiveFieldPolicy,
    listenerErrorPolicy: options.listenerErrorPolicy,
    onListenerError: options.onListenerError,
  });
  const primitiveRegistry = resolvePrimitiveRegistry(options.primitiveRegistry);
  const designSystemRegistry = resolveDesignSystemRegistry(options.designSystemRegistry);
  const labels = resolveKitLabels(options.labels);
  const initialDesignSystem = resolveKitDesignSystem(options.designSystem);
  const mountedPrimitive = mountPrimitiveForm(container, view.form, {
    registry: primitiveRegistry,
    presentationRegistry: view.presentationRegistry,
    layout: options.layout,
    containerStrategy: options.containerStrategy,
    formLabel: labels.form,
    reportsLabel: labels.reports,
    submitLabel: labels.submit,
    validatingLabel: labels.validating,
    submittingLabel: labels.submitting,
    reportPane: options.reportPane,
    text: options.primitiveText,
    reportTransport: options.reportTransport,
  });
  const designSystem = attachDesignSystem(mountedPrimitive.host, {
    config: initialDesignSystem,
    registry: designSystemRegistry,
    onChange: options.onDesignSystemChange,
  });

  let unmounted = false;

  const mounted: MountedForm = Object.freeze({
    form: view.form,
    host: mountedPrimitive.host,
    engineRegistry: view.engineRegistry,
    presentationRegistry: view.presentationRegistry,
    primitiveRegistry,
    designSystemRegistry,
    designSystem,
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
    unmount() {
      if (unmounted) {
        return;
      }

      unmounted = true;

      if (hostContainer[mountedFormRef] === mounted) {
        delete hostContainer[mountedFormRef];
      }

      view.form.abortSubmit("unmount");
      designSystem.disconnect();
      mountedPrimitive.unmount();
    },
  });

  hostContainer[mountedFormRef] = mounted;

  return mounted;
};

export const unmountForm = (mounted: MountedForm): void => {
  mounted.unmount();
};
