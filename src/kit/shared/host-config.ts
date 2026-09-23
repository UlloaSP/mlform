// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { resolvePrimitiveText, type PrimitiveRegistry } from "@/primitives";
import type { FormViewController } from "@/view";
import type { resolveKitLabels } from "../defaults";
import type { MountFormOptions } from "../mount-types";

export interface LayoutHostContext {
  ownerDocument: Document;
  options: MountFormOptions;
  registry: PrimitiveRegistry;
  labels: ReturnType<typeof resolveKitLabels>;
  view: FormViewController;
}

export const createRegisteredHost = (ownerDocument: Document, tagName: string): HTMLElement => {
  if (!ownerDocument.defaultView?.customElements.get(tagName)) {
    throw new TypeError(
      "MLForm elements are not registered in the container's document. Load MLForm in that document before mounting.",
    );
  }
  return ownerDocument.createElement(tagName);
};

type LayoutHost = HTMLElement & {
  view: FormViewController | undefined;
  registry: PrimitiveRegistry | undefined;
  primitiveText: ReturnType<typeof resolvePrimitiveText>;
  reportTransport: MountFormOptions["reportTransport"];
  reportFetchMode: NonNullable<MountFormOptions["reportFetchMode"]>;
  reportPane: NonNullable<MountFormOptions["reportPane"]>;
};

export const configureLayoutHost = <T extends LayoutHost>(
  host: T,
  { options, registry, view }: LayoutHostContext,
): T => {
  host.view = view;
  host.registry = registry;
  host.primitiveText = resolvePrimitiveText(options.primitiveText);
  host.reportTransport = options.reportTransport;
  host.reportFetchMode = options.reportFetchMode ?? "lazy";
  host.reportPane = options.reportPane ?? "auto";
  return host;
};
