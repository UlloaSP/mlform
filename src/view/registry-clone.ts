// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { createRegistry, type Registry } from "@/schema";

export const cloneSchemaRegistry = (registry: Registry): Registry => {
  const clone = createRegistry();
  for (const definition of registry.listFields()) clone.registerField(definition);
  for (const definition of registry.listReports()) clone.registerReport(definition);
  return clone;
};
