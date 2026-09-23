// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { LayoutHostContext } from "./shared/host-config";
import { createSinglePageHost } from "./single-page/host";
import { createTabsHost } from "./tabs/host";
import { createWizardHost } from "./wizard/host";

export const createLayoutHost = (context: LayoutHostContext): HTMLElement => {
  switch (context.view.getSnapshot().layout.kind) {
    case "wizard":
      return createWizardHost(context);
    case "tabs":
      return createTabsHost(context);
    case "stacked":
    case "split":
      return createSinglePageHost(context);
  }
};
