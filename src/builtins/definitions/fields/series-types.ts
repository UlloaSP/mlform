// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

export type SeriesPoint = Record<string, unknown>;

export type SeriesColumnConfig = {
  id: string;
  kind: string;
  label: string;
  required?: boolean;
  [key: string]: unknown;
};
