// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import "./accordion-root";

import { attachDesignSystem } from "@/design-system";
import { resolvePrimitiveText } from "@/primitives/constants";
import { kitErrorMessages, kitTagNames } from "./constants";
import { resolveKitDesignSystem, resolveKitLabels } from "./defaults";
import type { FormViewController, MountAccordionFormOptions, MountedAccordionForm } from "./types";
import { createFormView } from "./view";

const mountedAccordionRef = Symbol("mlform.kit.accordion.mounted");

type AccordionContainer = HTMLElement & {
  [mountedAccordionRef]?: MountedAccordionForm;
};

const hasView = (
  options: MountAccordionFormOptions,
): options is Extract<MountAccordionFormOptions, { view: FormViewController }> => {
  return "view" in options;
};

export const mountAccordionForm = (
  container: HTMLElement,
  options: MountAccordionFormOptions,
): MountedAccordionForm => {
  const hostContainer = container as AccordionContainer;
  hostContainer[mountedAccordionRef]?.unmount();

  const view = hasView(options)
    ? options.view
    : createFormView({
        schema: options.schema,
        transport: options.transport,
        registry: options.registry,
        primitiveRegistry: options.primitiveRegistry,
        designSystemRegistry: options.designSystemRegistry,
        designSystem: options.designSystem,
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
  if (snapshot.layout.kind !== "accordion") {
    throw new TypeError(kitErrorMessages.accordionMissingLayout);
  }

  const labels = resolveKitLabels(options.labels);
  const primitiveText = resolvePrimitiveText(options.primitiveText);
  const initialDesignSystem = resolveKitDesignSystem(options.designSystem);
  const host = document.createElement(kitTagNames.accordion) as HTMLElement & {
    view: FormViewController;
    registry: FormViewController["primitiveRegistry"];
    primitiveText: ReturnType<typeof resolvePrimitiveText>;
    submitLabel: string;
    validatingLabel: string;
    submittingLabel: string;
  };

  host.view = view;
  host.registry = view.primitiveRegistry;
  host.primitiveText = primitiveText;
  host.submitLabel = labels.submit;
  host.validatingLabel = labels.validating;
  host.submittingLabel = labels.submitting;

  container.replaceChildren(host);

  const designSystem = attachDesignSystem(host, {
    config: initialDesignSystem,
    registry: view.designSystemRegistry,
    onChange: options.onDesignSystemChange,
  });

  let unmounted = false;

  const mounted: MountedAccordionForm = Object.freeze({
    view,
    form: view.form,
    host,
    designSystem,
    unmount() {
      if (unmounted) {
        return;
      }

      unmounted = true;

      if (hostContainer[mountedAccordionRef] === mounted) {
        delete hostContainer[mountedAccordionRef];
      }

      view.form.abortSubmit("unmount");
      designSystem.disconnect();
      host.remove();
    },
  });

  hostContainer[mountedAccordionRef] = mounted;
  return mounted;
};
