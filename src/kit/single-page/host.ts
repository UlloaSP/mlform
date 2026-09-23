// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import "./root";
import { kitTagNames } from "../constants";
import {
  configureLayoutHost,
  createRegisteredHost,
  type LayoutHostContext,
} from "../shared/host-config";
import type { KitSinglePageElement } from "./root";

export const createSinglePageHost = (context: LayoutHostContext): KitSinglePageElement => {
  const host = configureLayoutHost(
    createRegisteredHost(context.ownerDocument, kitTagNames.disclosure) as KitSinglePageElement,
    context,
  );
  host.submitLabel = context.labels.submit;
  host.validatingLabel = context.labels.validating;
  host.submittingLabel = context.labels.submitting;
  host.sectionsOpen = context.labels.sectionsOpen;
  return host;
};
