// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { ReportResult } from "@/schema";

export const readyReport = (
  mappedTo: string | number,
  payload: unknown,
  backend = "default",
): ReportResult => ({ backend, mappedTo, status: "ready", payload });
