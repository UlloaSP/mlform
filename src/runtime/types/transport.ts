// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type {
  SubmitRequest as BaseSubmitRequest,
  Transport as BaseTransport,
  TransportStreamEvent as BaseTransportStreamEvent,
} from "@/transport";
import type { SubmitResult as SchemaSubmitResult } from "@/schema";
import type { NormalizedFieldConfig } from "./field";
import type { NormalizedReportConfig, ReportStateSnapshot } from "./report";

export type {
  CapabilityRequirement,
  CircuitBreakerSharedState,
  CircuitBreakerStateSnapshot,
  RateLimitLeaseRequest,
  SharedRateLimiter,
  SharedRateLimiterLease,
  SubmitRequestMetadata,
  SubmitRequestTransportContext,
  TransportAuthKind,
  TransportBackpressureMode,
  TransportCacheEntry,
  TransportCacheStore,
  TransportCapabilities,
  TransportCollection,
  TransportConsistency,
  TransportDeliveryMode,
  TransportHealthSnapshot,
  TransportHealthState,
  TransportPolicyContext,
  TransportResponse,
  TransportSession,
  TransportSessionCloseEvent,
  TransportSessionErrorEvent,
  TransportSessionEvent,
  TransportSessionMessage,
  TransportSessionMessageEvent,
  TransportSessionMetaEvent,
  TransportSessionProgressEvent,
  TransportSessionResultEvent,
  TransportStreamChunkEvent,
  TransportStreamErrorEvent,
  TransportStreamMetaEvent,
  TransportStreamProgressEvent,
  TransportStreamReportPatchEvent,
  TransportStreamReportReplaceEvent,
} from "@/transport";

export type SubmitRequest = BaseSubmitRequest<NormalizedFieldConfig, NormalizedReportConfig>;

export type SubmitResult = SchemaSubmitResult<ReportStateSnapshot>;

export type Transport = BaseTransport<NormalizedFieldConfig, NormalizedReportConfig>;

export type TransportStreamEvent = BaseTransportStreamEvent;

export interface SubmitOptions {
  signal?: AbortSignal;
  backend?: string;
}

export interface BeforeSubmitContext {
  backend?: string;
  values: Record<string, unknown>;
  fieldValues: Record<string, unknown>;
  serializedValues: Record<string, unknown>;
  serializedFieldValues: Record<string, unknown>;
  submitCount: number;
  signal: AbortSignal;
}

export interface AfterSubmitContext {
  backend?: string;
  values: Record<string, unknown>;
  fieldValues: Record<string, unknown>;
  serializedValues: Record<string, unknown>;
  serializedFieldValues: Record<string, unknown>;
  submitCount: number;
  result: SubmitResult;
}

export interface SubmitErrorContext {
  backend?: string;
  values: Record<string, unknown>;
  fieldValues: Record<string, unknown>;
  serializedValues: Record<string, unknown>;
  serializedFieldValues: Record<string, unknown>;
  submitCount: number;
  error: unknown;
}
