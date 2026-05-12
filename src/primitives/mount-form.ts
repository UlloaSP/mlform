// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { FormController } from "@/runtime";
import { createMlRegistryPack } from "@/builtins-ml";
import "./register";
import {
  primitiveDefaultLabels,
  primitiveTagNames,
  resolvePrimitiveText,
  type PrimitiveText,
} from "./constants";
import { createBuiltinPrimitiveRegistry } from "./registry";
import type {
  MountFormOptions,
  MountedForm,
  PrimitiveContainerStrategy,
  PrimitiveRegistry,
} from "./types";
import type { PresentationRegistry } from "@/presentation";

const assertContainerStrategy = (
  container: HTMLElement,
  containerStrategy: PrimitiveContainerStrategy,
): void => {
  if (container.childNodes.length > 0 && containerStrategy !== "replace") {
    throw new TypeError('Mount into an empty container or pass `containerStrategy: "replace"`.');
  }
};

const resolveRegistry = (registry: PrimitiveRegistry | undefined): PrimitiveRegistry => {
  return registry ? registry.clone() : createBuiltinPrimitiveRegistry();
};

const resolvePresentationRegistry = (
  registry: PresentationRegistry | undefined,
): PresentationRegistry => {
  return registry?.clone() ?? createMlRegistryPack().presentationRegistry;
};

export const mountForm = (
  container: HTMLElement,
  form: FormController,
  options: MountFormOptions = {},
): MountedForm => {
  const host = document.createElement(primitiveTagNames.form) as HTMLElement & {
    form: FormController;
    registry: PrimitiveRegistry;
    presentationRegistry: PresentationRegistry;
    layout: NonNullable<MountFormOptions["layout"]>;
    formLabel: string;
    reportsLabel: string;
    submitLabel: string;
    validatingLabel: string;
    submittingLabel: string;
    reportPane: NonNullable<MountFormOptions["reportPane"]>;
    text: PrimitiveText;
    reportTransport: MountFormOptions["reportTransport"];
  };
  const registry = resolveRegistry(options.registry);
  const presentationRegistry = resolvePresentationRegistry(options.presentationRegistry);
  const text = resolvePrimitiveText(options.text);
  const containerStrategy = options.containerStrategy ?? "error";
  const previousChildren = containerStrategy === "replace" ? Array.from(container.childNodes) : [];

  assertContainerStrategy(container, containerStrategy);

  host.form = form;
  host.registry = registry;
  host.presentationRegistry = presentationRegistry;
  host.layout = options.layout ?? "stacked";
  host.formLabel = options.formLabel ?? primitiveDefaultLabels.form;
  host.reportsLabel = options.reportsLabel ?? primitiveDefaultLabels.reports;
  host.submitLabel = options.submitLabel ?? primitiveDefaultLabels.submit;
  host.validatingLabel = options.validatingLabel ?? primitiveDefaultLabels.validating;
  host.submittingLabel = options.submittingLabel ?? primitiveDefaultLabels.submitting;
  host.reportPane = options.reportPane ?? "auto";
  host.text = text;
  host.reportTransport = options.reportTransport;

  container.replaceChildren(host);

  let unmounted = false;

  return Object.freeze({
    form,
    host,
    registry,
    presentationRegistry,
    text,
    unmount() {
      if (unmounted) {
        return;
      }

      unmounted = true;

      if (host.parentNode === container) {
        if (containerStrategy === "replace" && previousChildren.length > 0) {
          container.replaceChildren(...previousChildren);
        } else {
          container.removeChild(host);
        }
      } else {
        host.remove();

        if (
          containerStrategy === "replace" &&
          previousChildren.length > 0 &&
          container.childNodes.length === 0
        ) {
          container.replaceChildren(...previousChildren);
        }
      }
    },
  });
};

export const unmountForm = (mounted: MountedForm): void => {
  mounted.unmount();
};
