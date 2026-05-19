// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import "./tabs-root";

import { attachDesignSystem } from "@/design-system";
import { resolvePrimitiveText, type PrimitiveRegistry } from "@/primitives";
import { kitErrorMessages, kitTagNames } from "./constants";
import {
  resolveDesignSystemRegistry,
  resolveKitDesignSystem,
  resolveKitLabels,
  resolvePrimitiveRegistry,
} from "./defaults";
import type { FormViewController, MountTabsFormOptions, MountedTabsForm } from "./types";
import { createFormView } from "./view";

const mountedTabsRef = Symbol("mlform.kit.tabs.mounted");

type TabsContainer = HTMLElement & {
  [mountedTabsRef]?: MountedTabsForm;
};

const hasView = (
  options: MountTabsFormOptions,
): options is Extract<MountTabsFormOptions, { view: FormViewController }> => {
  return "view" in options;
};

export const mountTabsForm = (
  container: HTMLElement,
  options: MountTabsFormOptions,
): MountedTabsForm => {
  const hostContainer = container as TabsContainer;
  hostContainer[mountedTabsRef]?.unmount();

  const view = hasView(options)
    ? options.view
    : createFormView({
        schema: options.schema,
        transport: options.transport,
        registry: options.registry,
        presentationRegistry: options.presentationRegistry,
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

  const snapshot = view.getSnapshot();
  if (snapshot.layout.kind !== "tabs") {
    throw new TypeError(kitErrorMessages.tabsMissingLayout);
  }

  const labels = resolveKitLabels(options.labels);
  const primitiveText = resolvePrimitiveText(options.primitiveText);
  const initialDesignSystem = resolveKitDesignSystem(options.designSystem);
  const primitiveRegistry = resolvePrimitiveRegistry(options.primitiveRegistry);
  const designSystemRegistry = resolveDesignSystemRegistry(options.designSystemRegistry);
  const host = document.createElement(kitTagNames.tabs) as HTMLElement & {
    view: FormViewController;
    registry: PrimitiveRegistry;
    primitiveText: ReturnType<typeof resolvePrimitiveText>;
    submitLabel: string;
    validatingLabel: string;
    submittingLabel: string;
  };

  host.view = view;
  host.registry = primitiveRegistry;
  host.primitiveText = primitiveText;
  host.submitLabel = labels.submit;
  host.validatingLabel = labels.validating;
  host.submittingLabel = labels.submitting;

  container.replaceChildren(host);

  const designSystem = attachDesignSystem(host, {
    config: initialDesignSystem,
    registry: designSystemRegistry,
    onChange: options.onDesignSystemChange,
  });

  let unmounted = false;

  const mounted: MountedTabsForm = Object.freeze({
    view,
    form: view.form,
    host,
    designSystem,
    unmount() {
      if (unmounted) {
        return;
      }

      unmounted = true;

      if (hostContainer[mountedTabsRef] === mounted) {
        delete hostContainer[mountedTabsRef];
      }

      view.form.abortSubmit("unmount");
      designSystem.disconnect();
      host.remove();
    },
  });

  hostContainer[mountedTabsRef] = mounted;
  return mounted;
};
