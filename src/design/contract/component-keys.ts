// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

export const componentKeys = [
  "shell",
  "hero",
  "field",
  "report",
  "input",
  "submit",
  "error",
  "toggle",
  "status",
  "chart",
] as const;

export type ComponentKey = (typeof componentKeys)[number];
