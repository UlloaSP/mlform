// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type {
  ExplanationPresenter,
  FieldPresenter,
  PresentationRegistry,
  ReportPresenter,
} from "@/presentation";
import type { RuntimeBehavior } from "@/runtime";
import type { Registry } from "@/schema";

type DescriptorCapableFieldDefinition = {
  kind: string;
  describe?: FieldPresenter<any, any>["describe"];
};

type DescriptorCapableReportDefinition = {
  kind: string;
  describe?: ReportPresenter<any>["describe"];
};

type DescriptorCapableExplanationDefinition = {
  kind: string;
  describe?: ExplanationPresenter<any>["describe"];
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
  if (!definition.describe) {
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
  if (!definition.describe) {
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
  if (!definition.describe) {
    return;
  }

  presentationRegistry.registerExplanation({
    kind: definition.kind,
    describe: definition.describe,
  });
};
