// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { FieldPresenter, PresentationRegistry, ReportPresenter } from "@/presentation";
import type { RuntimeBehavior } from "@/runtime";
import type { FieldConfig, Registry, ReportConfig } from "@/schema";

type DescriptorCapableFieldDefinition = {
  kind: string;
  describe?: FieldPresenter<FieldConfig, unknown>["describe"];
};

type DescriptorCapableReportDefinition = {
  kind: string;
  describe?: ReportPresenter<ReportConfig>["describe"];
};

export type RegistryPack = {
  registry: Registry;
  presentationRegistry: PresentationRegistry;
  behaviors: RuntimeBehavior[];
};

export const registerFieldPresenterFromDefinition = (
  presentationRegistry: PresentationRegistry,
  definition: DescriptorCapableFieldDefinition,
): void => {
  if (!definition.describe || presentationRegistry.getField(definition.kind)) {
    return;
  }

  presentationRegistry.registerField({
    kind: definition.kind,
    describe: definition.describe,
  });
};

export const registerReportPresenterFromDefinition = (
  presentationRegistry: PresentationRegistry,
  definition: DescriptorCapableReportDefinition,
): void => {
  if (!definition.describe || presentationRegistry.getReport(definition.kind)) {
    return;
  }

  presentationRegistry.registerReport({
    kind: definition.kind,
    describe: definition.describe,
  });
};
