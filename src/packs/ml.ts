// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { classifierReportDefinition, regressorReportDefinition } from "@/builtins-ml/definitions";
import { registerReportPresenterFromDefinition, type RegistryPack } from "./shared";
import { createDefaultRegistryPack } from "./default";

const reportDefinitions = [classifierReportDefinition, regressorReportDefinition] as const;

export const createMlRegistryPack = (): RegistryPack => {
  const pack = createDefaultRegistryPack();

  for (const definition of reportDefinitions) {
    pack.registry.registerReport(definition as never);
    registerReportPresenterFromDefinition(pack.presentationRegistry, definition);
  }

  return pack;
};
