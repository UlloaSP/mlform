// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { attachDesignSystem, type DesignSystemConfig } from "@/design-system";
import {
  mountForm as mountPrimitiveForm,
  resolvePrimitiveText,
  type PrimitiveRegistry,
} from "@/primitives";
import "./layout-root";
import "./tabs-root";
import "./wizard-root";
import { kitErrorMessages, kitTagNames } from "./constants";
import {
  resolveDesignSystemRegistry,
  resolveKitDesignSystem,
  resolveKitLabels,
  resolvePrimitiveRegistry,
} from "./defaults";
import type { KitDesignSystemSnapshot, MountFormOptions, MountedForm } from "./types";
import { createFormView } from "./view";
import { defaultWizardLabels, resolveWizardText } from "./wizard-constants";

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

const hasLayoutChildren = (options: MountFormOptions): boolean => {
  const layout = options.layout;
  return Boolean(layout && "children" in layout && layout.children && layout.children.length > 0);
};

const createView = (options: MountFormOptions) =>
  createFormView({
    schema: options.schema,
    transport: options.transport,
    registry: options.registry,
    descriptorRegistry: options.descriptorRegistry,
    behaviors: options.behaviors,
    initialValues: options.initialValues,
    validators: options.validators,
    hooks: options.hooks,
    hookFailurePolicy: options.hookFailurePolicy,
    inactiveFieldPolicy: options.inactiveFieldPolicy,
    listenerErrorPolicy: options.listenerErrorPolicy,
    onListenerError: options.onListenerError,
    layout: options.layout,
  });

export const mountForm = (container: HTMLElement, options: MountFormOptions): MountedForm => {
  const hostContainer = container as KitContainer;
  hostContainer[mountedFormRef]?.unmount();

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
  const view = createView(options);
  let unmountHost = (): void => {};
  const host = shouldUsePrimitive
    ? (() => {
        const mountedPrimitive = mountPrimitiveForm(container, view.form, {
          registry: primitiveRegistry,
          descriptorRegistry: view.descriptorRegistry,
          layout: options.layout?.kind === "split" ? "split" : "stacked",
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
        unmountHost = () => mountedPrimitive.unmount();
        return mountedPrimitive.host;
      })()
    : (() => {
        const layoutHost = mountLayoutHost(container, options, primitiveRegistry, labels, view);
        unmountHost = () => layoutHost.remove();
        return layoutHost;
      })();

  const designSystem = attachDesignSystem(host, {
    config: initialDesignSystem,
    registry: designSystemRegistry,
    onChange: options.onDesignSystemChange,
  });

  let unmounted = false;

  const mounted: MountedForm = Object.freeze({
    form: view.form,
    host,
    engineRegistry: view.engineRegistry,
    descriptorRegistry: view.descriptorRegistry,
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
      unmountHost();
    },
  });

  hostContainer[mountedFormRef] = mounted;

  return mounted;
};

export const unmountForm = (mounted: MountedForm): void => {
  mounted.unmount();
};

const mountLayoutHost = (
  container: HTMLElement,
  options: MountFormOptions,
  primitiveRegistry: PrimitiveRegistry,
  labels: ReturnType<typeof resolveKitLabels>,
  view: ReturnType<typeof createView>,
): HTMLElement => {
  const snapshot = view.getSnapshot();
  const tagName =
    snapshot.layout.kind === "wizard"
      ? kitTagNames.wizard
      : snapshot.layout.kind === "tabs"
        ? kitTagNames.tabs
        : kitTagNames.disclosure;
  const host = document.createElement(tagName) as unknown as HTMLElement & Record<string, unknown>;
  host.view = view;
  host.registry = primitiveRegistry;
  host.primitiveText = resolvePrimitiveText(options.primitiveText);

  if (snapshot.layout.kind === "wizard") {
    const wizardLabels = { ...defaultWizardLabels, ...options.labels };
    host.labels = wizardLabels;
    host.text = resolveWizardText({
      prevLabel: wizardLabels.prev,
      nextLabel: wizardLabels.next,
      submitLabel: wizardLabels.submit,
      validatingLabel: wizardLabels.validating,
      submittingLabel: wizardLabels.submitting,
    });
  } else {
    host.submitLabel = labels.submit;
    host.validatingLabel = labels.validating;
    host.submittingLabel = labels.submitting;
  }

  container.replaceChildren(host);
  return host;
};
