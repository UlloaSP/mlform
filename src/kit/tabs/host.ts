// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import "./root";
import { kitTagNames } from "../constants";
import {
  configureLayoutHost,
  createRegisteredHost,
  type LayoutHostContext,
} from "../shared/host-config";
import type { KitTabsElement } from "./root";

export const createTabsHost = (context: LayoutHostContext): KitTabsElement => {
  const host = configureLayoutHost(
    createRegisteredHost(context.ownerDocument, kitTagNames.tabs) as KitTabsElement,
    context,
  );
  host.submitLabel = context.labels.submit;
  host.validatingLabel = context.labels.validating;
  host.submittingLabel = context.labels.submitting;
  host.previousLabel = context.labels.prev;
  host.nextLabel = context.labels.next;
  host.tabsLabel = context.labels.tabs;
  return host;
};
