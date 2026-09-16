// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { createRegistry, type Registry } from "@/schema";
import { builtinFieldDefinitions, builtinReportDefinitions } from "./definitions";

export const createBuiltinMlRegistry = (): Registry => {
  const registry = createRegistry();
  for (const definition of builtinFieldDefinitions) registry.registerField(definition as never);
  for (const definition of builtinReportDefinitions) registry.registerReport(definition as never);
  return registry;
};
