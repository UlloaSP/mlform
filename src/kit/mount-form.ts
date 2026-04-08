// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { attachDesignSystem, type DesignSystemConfig } from "@/design-system";
import { createForm, type Transport } from "@/engine";
import { mountForm as mountPrimitiveForm } from "@/primitives";
import {
  cloneEngineRegistry,
  resolveDesignSystemRegistry,
  resolveKitDesignSystem,
  resolveKitLabels,
  resolvePrimitiveRegistry,
} from "./defaults";
import { createJsonTransport } from "./transport";
import type { MountFormOptions, MountedForm } from "./types";

const resolveTransport = (options: MountFormOptions): Transport => {
  if (options.transport) {
    return options.transport;
  }

  if (options.endpoint) {
    return createJsonTransport({
      endpoint: options.endpoint,
      ...options.transportOptions,
    });
  }

  throw new TypeError("mountForm requires either a transport or an endpoint.");
};

export const mountForm = (container: HTMLElement, options: MountFormOptions): MountedForm => {
  const engineRegistry = cloneEngineRegistry(options.registry);
  const primitiveRegistry = resolvePrimitiveRegistry(options.primitiveRegistry);
  const designSystemRegistry = resolveDesignSystemRegistry(options.designSystemRegistry);
  const labels = resolveKitLabels(options.labels);
  const initialDesignSystem = resolveKitDesignSystem(options.designSystem);
  const form = createForm({
    schema: options.schema,
    registry: engineRegistry,
    transport: resolveTransport(options),
    initialValues: options.initialValues,
    validators: options.validators,
    hooks: options.hooks,
    inactiveFieldPolicy: options.inactiveFieldPolicy,
  });
  const mountedPrimitive = mountPrimitiveForm(container, form, {
    registry: primitiveRegistry,
    layout: options.layout,
    formLabel: labels.form,
    reportsLabel: labels.reports,
    submitLabel: labels.submit,
    validatingLabel: labels.validating,
    submittingLabel: labels.submitting,
    reportPane: options.reportPane,
  });
  const designSystem = attachDesignSystem(mountedPrimitive.host, {
    config: initialDesignSystem,
    registry: designSystemRegistry,
    onChange: options.onDesignSystemChange,
  });

  return {
    form,
    host: mountedPrimitive.host,
    engineRegistry,
    primitiveRegistry,
    designSystemRegistry,
    designSystem,
    updateDesignSystem(config: DesignSystemConfig) {
      designSystem.update(config);
    },
    replaceDesignSystem(config: DesignSystemConfig) {
      designSystem.replace(resolveKitDesignSystem(config));
    },
    resetDesignSystem() {
      designSystem.reset();
    },
    unmount() {
      designSystem.disconnect();
      mountedPrimitive.unmount();
    },
  };
};

export const unmountForm = (mounted: MountedForm): void => {
  mounted.unmount();
};
