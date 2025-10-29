// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

export interface DescriptorItem {
  tag: string;
  props: Record<string, unknown>;
  child?: DescriptorItem;
  slot: "inputs" | "report" | "layout";
}
