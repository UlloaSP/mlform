// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import "./wizard-root";

import { attachDesignSystem } from "@/design-system";
import { resolvePrimitiveText, type PrimitiveRegistry } from "@/primitives";
import { kitErrorMessages, kitTagNames } from "./constants";
import {
  resolveDesignSystemRegistry,
  resolveKitDesignSystem,
  resolvePrimitiveRegistry,
} from "./defaults";
import type { FormViewController, MountWizardFormOptions, MountedWizardForm } from "./types";
import { defaultWizardLabels, resolveWizardText } from "./wizard-constants";
import { createFormView } from "./view";

const mountedWizardRef = Symbol("mlform.kit.wizard.mounted");

type WizardContainer = HTMLElement & {
  [mountedWizardRef]?: MountedWizardForm;
};

const hasView = (
  options: MountWizardFormOptions,
): options is Extract<MountWizardFormOptions, { view: FormViewController }> => {
  return "view" in options;
};

export const mountWizardForm = (
  container: HTMLElement,
  options: MountWizardFormOptions,
): MountedWizardForm => {
  const hostContainer = container as WizardContainer;
  hostContainer[mountedWizardRef]?.unmount();

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
  if (snapshot.layout.kind !== "wizard") {
    throw new TypeError(kitErrorMessages.wizardMissingLayout);
  }

  const host = document.createElement(kitTagNames.wizard) as HTMLElement & {
    view: FormViewController;
    registry: PrimitiveRegistry;
    primitiveText: ReturnType<typeof resolvePrimitiveText>;
    labels: typeof defaultWizardLabels;
    text: ReturnType<typeof resolveWizardText>;
  };

  const labels = {
    ...defaultWizardLabels,
    ...options.labels,
  };
  const text = resolveWizardText({
    ...options.text,
    prevLabel: labels.prev,
    nextLabel: labels.next,
    submitLabel: labels.submit,
    validatingLabel: labels.validating,
    submittingLabel: labels.submitting,
  });
  const primitiveText = resolvePrimitiveText(options.primitiveText);
  const initialDesignSystem = resolveKitDesignSystem(options.designSystem);
  const primitiveRegistry = resolvePrimitiveRegistry(options.primitiveRegistry);
  const designSystemRegistry = resolveDesignSystemRegistry(options.designSystemRegistry);

  host.view = view;
  host.registry = primitiveRegistry;
  host.primitiveText = primitiveText;
  host.labels = labels;
  host.text = text;

  container.replaceChildren(host);

  const designSystem = attachDesignSystem(host, {
    config: initialDesignSystem,
    registry: designSystemRegistry,
    onChange: options.onDesignSystemChange,
  });

  let unmounted = false;

  const mounted: MountedWizardForm = Object.freeze({
    view,
    form: view.form,
    host,
    designSystem,
    unmount() {
      if (unmounted) {
        return;
      }

      unmounted = true;

      if (hostContainer[mountedWizardRef] === mounted) {
        delete hostContainer[mountedWizardRef];
      }

      view.form.abortSubmit("unmount");
      designSystem.disconnect();
      host.remove();
    },
  });

  hostContainer[mountedWizardRef] = mounted;
  return mounted;
};
