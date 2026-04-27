// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

export interface TransportStreamProgressEvent {
  type: "progress";
  loaded?: number;
  total?: number;
  message?: string;
  meta?: Record<string, unknown>;
}

export interface TransportStreamMetaEvent {
  type: "meta";
  meta: Record<string, unknown>;
}

export interface TransportStreamChunkEvent {
  type: "chunk";
  chunk: unknown;
  meta?: Record<string, unknown>;
}

export interface TransportStreamReportReplaceEvent {
  type: "report-replace";
  reportId: string;
  payload: unknown;
  meta?: Record<string, unknown>;
}

export interface TransportStreamReportPatchEvent {
  type: "report-patch";
  reportId: string;
  patch: unknown;
  strategy?: "replace" | "shallow-merge" | "deep-merge";
  meta?: Record<string, unknown>;
}

export interface TransportStreamFieldUpdateEvent {
  type: "field-update";
  fieldId: string;
  value?: unknown;
  errors?: string[];
  touched?: boolean;
  dirty?: boolean;
  status?: string;
  meta?: Record<string, unknown>;
}

export interface TransportStreamResultEvent {
  type: "result";
  result: unknown;
  meta?: Record<string, unknown>;
}

export interface TransportStreamErrorEvent {
  type: "error";
  error: unknown;
  meta?: Record<string, unknown>;
}

export type TransportStreamEvent =
  | TransportStreamProgressEvent
  | TransportStreamMetaEvent
  | TransportStreamChunkEvent
  | TransportStreamReportReplaceEvent
  | TransportStreamReportPatchEvent
  | TransportStreamFieldUpdateEvent
  | TransportStreamResultEvent
  | TransportStreamErrorEvent;
