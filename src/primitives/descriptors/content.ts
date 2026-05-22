// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

export type DescriptorTone = "neutral" | "info" | "success" | "warning" | "danger";

export interface DescriptorSummary {
  title?: string;
  description?: string;
  value?: unknown;
  badge?: string;
  tone?: DescriptorTone;
}

export interface DescriptorTextNode {
  type: "text";
  label?: string;
  value: unknown;
  tone?: DescriptorTone;
}

export interface DescriptorMetricNode {
  type: "metric";
  label: string;
  value: unknown;
  hint?: string;
  tone?: DescriptorTone;
}

export interface DescriptorKeyValueEntry {
  label: string;
  value: unknown;
}

export interface DescriptorKeyValueNode {
  type: "kv";
  label?: string;
  entries: DescriptorKeyValueEntry[] | Record<string, unknown>;
}

export interface DescriptorListNode {
  type: "list";
  label?: string;
  items: unknown[];
  ordered?: boolean;
}

export interface DescriptorTableNode {
  type: "table";
  label?: string;
  columns: string[];
  rows: Array<Record<string, unknown> | unknown[]>;
}

export interface DescriptorBadgeNode {
  type: "badge";
  label: string;
  tone?: DescriptorTone;
}

export interface DescriptorNoticeNode {
  type: "notice";
  title?: string;
  body: unknown;
  tone?: DescriptorTone;
}

export interface DescriptorJsonNode {
  type: "json";
  label?: string;
  value: unknown;
}

export type DescriptorNode =
  | DescriptorTextNode
  | DescriptorMetricNode
  | DescriptorKeyValueNode
  | DescriptorListNode
  | DescriptorTableNode
  | DescriptorBadgeNode
  | DescriptorNoticeNode
  | DescriptorJsonNode;

export type DescriptorContent = DescriptorNode | DescriptorNode[];

export const toDescriptorNodes = (value: DescriptorContent | undefined): DescriptorNode[] => {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
};
