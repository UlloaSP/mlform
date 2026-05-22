// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { PrimitiveDescriptorRegistry } from "@/primitives";
import type { FormController } from "@/runtime";
import type { ResolvedLayoutResult } from "./layout";
import type { FormViewSnapshot } from "./types";
import { buildFormViewSnapshot } from "./view-snapshot";

type SnapshotCacheOptions = {
  form: FormController;
  descriptorRegistry: PrimitiveDescriptorRegistry;
  resolvedLayout: ResolvedLayoutResult;
  getStepIndex: () => number;
  getActiveTabIndex: () => number;
  getOpenSectionIds: () => Set<string>;
};

export const createFormViewSnapshotCache = ({
  form,
  descriptorRegistry,
  resolvedLayout,
  getStepIndex,
  getActiveTabIndex,
  getOpenSectionIds,
}: SnapshotCacheOptions): (() => FormViewSnapshot) => {
  let cachedFormState = form.state;
  let cachedStepIndex = -1;
  let cachedActiveTabIndex = -1;
  let cachedOpenSectionKey = "";
  let cachedSnapshot: FormViewSnapshot | null = null;

  return () => {
    const stepIndex = getStepIndex();
    const activeTabIndex = getActiveTabIndex();
    const openSectionIds = getOpenSectionIds();
    const currentFormState = form.state;
    const currentOpenSectionKey = Array.from(openSectionIds).sort().join("|");
    if (
      cachedSnapshot &&
      cachedFormState === currentFormState &&
      cachedStepIndex === stepIndex &&
      cachedActiveTabIndex === activeTabIndex &&
      cachedOpenSectionKey === currentOpenSectionKey
    ) {
      return cachedSnapshot;
    }

    cachedFormState = currentFormState;
    cachedStepIndex = stepIndex;
    cachedActiveTabIndex = activeTabIndex;
    cachedOpenSectionKey = currentOpenSectionKey;
    cachedSnapshot = buildFormViewSnapshot({
      form,
      descriptorRegistry,
      resolvedLayout,
      stepIndex,
      activeTabIndex,
      openSectionIds,
    });
    return cachedSnapshot;
  };
};
