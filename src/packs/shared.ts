// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type {
  ExplanationPresenter,
  FieldPresenter,
  PresentationRegistry,
  ReportPresenter,
} from "@/presentation";
import type { RuntimeBehavior } from "@/runtime";
import type { ExplanationConfig, FieldConfig, Registry, ReportConfig } from "@/schema";

type DescriptorCapableFieldDefinition = {
  kind: string;
  describe?: FieldPresenter<FieldConfig, unknown>["describe"];
};

type DescriptorCapableReportDefinition = {
  kind: string;
  describe?: ReportPresenter<ReportConfig>["describe"];
};

type DescriptorCapableExplanationDefinition = {
  kind: string;
  describe?: ExplanationPresenter<ExplanationConfig>["describe"];
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

export const registerExplanationPresenterFromDefinition = (
  presentationRegistry: PresentationRegistry,
  definition: DescriptorCapableExplanationDefinition,
): void => {
  if (!definition.describe || presentationRegistry.getExplanation(definition.kind)) {
    return;
  }

  presentationRegistry.registerExplanation({
    kind: definition.kind,
    describe: definition.describe,
  });
};

export const registerPresentersFromRegistry = (
  presentationRegistry: PresentationRegistry,
  registry: Registry,
): void => {
  for (const definition of registry.listFields()) {
    registerFieldPresenterFromDefinition(presentationRegistry, definition);
  }

  for (const definition of registry.listReports()) {
    registerReportPresenterFromDefinition(presentationRegistry, definition);
  }

  for (const definition of registry.listExplanations()) {
    registerExplanationPresenterFromDefinition(presentationRegistry, definition);
  }
};
