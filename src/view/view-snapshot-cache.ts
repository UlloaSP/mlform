// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { PrimitiveDescriptorRegistry } from "@/primitives";
import type { FormController } from "@/runtime";
import type { ResolvedLayoutResult } from "./layout";
import type { FormViewSnapshot } from "./view-core-types";
import { buildFormViewSnapshot } from "./view-snapshot";

type SnapshotCacheOptions = {
  form: FormController;
  descriptorRegistry: PrimitiveDescriptorRegistry;
  resolvedLayout: ResolvedLayoutResult;
  getStepIndex: () => number;
  getActiveTabIndex: () => number;
  getOpenSectionIds: () => Set<string>;
  getRevision: () => number;
};

export const createFormViewSnapshotCache = ({
  form,
  descriptorRegistry,
  resolvedLayout,
  getStepIndex,
  getActiveTabIndex,
  getOpenSectionIds,
  getRevision,
}: SnapshotCacheOptions): (() => FormViewSnapshot) => {
  let cachedRevision = -1;
  let cachedSnapshot: FormViewSnapshot | null = null;

  return () => {
    if (cachedSnapshot && cachedRevision === getRevision()) {
      return cachedSnapshot;
    }

    cachedRevision = getRevision();
    cachedSnapshot = buildFormViewSnapshot({
      form,
      descriptorRegistry,
      resolvedLayout,
      stepIndex: getStepIndex(),
      activeTabIndex: getActiveTabIndex(),
      openSectionIds: getOpenSectionIds(),
    });
    return cachedSnapshot;
  };
};
