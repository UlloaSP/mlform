// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { FormController } from "@/engine";
import "./register";
import { primitiveDefaultLabels, primitiveTagNames } from "./constants";
import { createBuiltinPrimitiveRegistry } from "./registry";
import type { MountFormOptions, MountedForm, PrimitiveRegistry } from "./types";

const resolveRegistry = (registry: PrimitiveRegistry | undefined): PrimitiveRegistry => {
  return registry ? registry.clone() : createBuiltinPrimitiveRegistry();
};

export const mountForm = (
  container: HTMLElement,
  form: FormController,
  options: MountFormOptions = {},
): MountedForm => {
  const host = document.createElement(primitiveTagNames.form);
  const registry = resolveRegistry(options.registry);

  host.form = form;
  host.registry = registry;
  host.layout = options.layout ?? "stacked";
  host.formLabel = options.formLabel ?? primitiveDefaultLabels.form;
  host.reportsLabel = options.reportsLabel ?? primitiveDefaultLabels.reports;
  host.submitLabel = options.submitLabel ?? primitiveDefaultLabels.submit;
  host.validatingLabel = options.validatingLabel ?? primitiveDefaultLabels.validating;
  host.submittingLabel = options.submittingLabel ?? primitiveDefaultLabels.submitting;
  host.reportPane = options.reportPane ?? "auto";

  container.replaceChildren(host);

  return {
    form,
    host,
    registry,
    unmount() {
      if (host.parentNode === container) {
        container.removeChild(host);
      } else {
        host.remove();
      }
    },
  };
};

export const unmountForm = (mounted: MountedForm): void => {
  mounted.unmount();
};
