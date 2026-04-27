// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

export type PresentationTone = "neutral" | "info" | "success" | "warning" | "danger";

export interface PresentationSummary {
  title?: string;
  description?: string;
  value?: unknown;
  badge?: string;
  tone?: PresentationTone;
}

export interface PresentationTextNode {
  type: "text";
  label?: string;
  value: unknown;
  tone?: PresentationTone;
}

export interface PresentationMetricNode {
  type: "metric";
  label: string;
  value: unknown;
  hint?: string;
  tone?: PresentationTone;
}

export interface PresentationKeyValueEntry {
  label: string;
  value: unknown;
}

export interface PresentationKeyValueNode {
  type: "kv";
  label?: string;
  entries: PresentationKeyValueEntry[] | Record<string, unknown>;
}

export interface PresentationListNode {
  type: "list";
  label?: string;
  items: unknown[];
  ordered?: boolean;
}

export interface PresentationTableNode {
  type: "table";
  label?: string;
  columns: string[];
  rows: Array<Record<string, unknown> | unknown[]>;
}

export interface PresentationBadgeNode {
  type: "badge";
  label: string;
  tone?: PresentationTone;
}

export interface PresentationNoticeNode {
  type: "notice";
  title?: string;
  body: unknown;
  tone?: PresentationTone;
}

export interface PresentationJsonNode {
  type: "json";
  label?: string;
  value: unknown;
}

export type PresentationNode =
  | PresentationTextNode
  | PresentationMetricNode
  | PresentationKeyValueNode
  | PresentationListNode
  | PresentationTableNode
  | PresentationBadgeNode
  | PresentationNoticeNode
  | PresentationJsonNode;

export type PresentationContent = PresentationNode | PresentationNode[];

export const toPresentationNodes = (value: PresentationContent | undefined): PresentationNode[] => {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
};
