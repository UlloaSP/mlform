// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { classifierReportDefinition, regressorReportDefinition } from "@/builtins-ml/definitions";
import { createMlRegistryPack as createPack } from "@/packs/ml";
import { createRegistry, type Registry } from "@/schema";

export { classifierReportDefinition, regressorReportDefinition };

export const createBuiltinMlRegistry = (): Registry => {
  return createRegistry()
    .registerReport(classifierReportDefinition)
    .registerReport(regressorReportDefinition);
};

export const createMlRegistryPack = createPack;
