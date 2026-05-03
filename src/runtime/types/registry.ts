// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { Registry as SchemaRegistry } from "@/schema";

export interface Registry extends Omit<
  SchemaRegistry,
  "registerExplanation" | "registerField" | "registerReport"
> {
  registerField(definition: any): Registry;
  registerReport(definition: any): Registry;
  registerExplanation(definition: any): Registry;
}
