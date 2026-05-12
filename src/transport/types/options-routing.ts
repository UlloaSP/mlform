// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { CapabilityRequirement } from "./capabilities";
import type { MaybePromise, SubmitRequest, Transport, TransportResponse } from "./core";
import type { TransportCollection } from "./middleware";
import type { TransportHealthState } from "./state";

export interface RoutingTransportOptions<TTransportId extends string = string> {
  transports: Record<TTransportId, Transport>;
  requiredCapabilities?: CapabilityRequirement;
  selectTransport: (
    request: SubmitRequest,
    context: {
      transportIds: readonly TTransportId[];
    },
  ) => MaybePromise<TTransportId>;
}

export interface WeightedRoutingTransportOptions<TTransportId extends string = string> {
  transports: Record<TTransportId, Transport>;
  requiredCapabilities?: CapabilityRequirement;
  weights:
    | Partial<Record<TTransportId, number>>
    | ((request: SubmitRequest, transportId: TTransportId) => MaybePromise<number>);
  filter?: (transportId: TTransportId, request: SubmitRequest) => MaybePromise<boolean>;
}

export interface FanoutTransportResult<TTransportId extends string = string> {
  id: TTransportId | undefined;
  index: number;
  response: TransportResponse;
}

export interface FanoutTransportFailure<TTransportId extends string = string> {
  id: TTransportId | undefined;
  index: number;
  error: unknown;
}

export interface FanoutTransportOptions<TTransportId extends string = string> {
  transports: TransportCollection<TTransportId>;
  requiredCapabilities?: CapabilityRequirement;
  filter?: (transportId: string, request: SubmitRequest) => MaybePromise<boolean>;
  transformRequest?: (transportId: string, request: SubmitRequest) => MaybePromise<SubmitRequest>;
  failurePolicy?: "fail-all" | "partial-success";
  abortPolicy?: "wait-all" | "abort-pending-on-first-failure" | "abort-pending-on-first-success";
  merge?: (context: {
    request: SubmitRequest;
    results: readonly FanoutTransportResult<TTransportId>[];
    failures: readonly FanoutTransportFailure<TTransportId>[];
  }) => MaybePromise<unknown>;
}

export interface FallbackTransportFailure<TTransportId extends string = string> {
  id: TTransportId | undefined;
  index: number;
  error: unknown;
}

export interface FallbackTransportOptions<TTransportId extends string = string> {
  transports: TransportCollection<TTransportId>;
  shouldFallback?: (
    error: unknown,
    context: {
      request: SubmitRequest;
      id: TTransportId | undefined;
      index: number;
      failures: readonly FallbackTransportFailure<TTransportId>[];
    },
  ) => MaybePromise<boolean>;
}

export interface PipelineStage {
  id?: string;
  transport: Transport;
  mapToNext?: (response: unknown, originalRequest: SubmitRequest) => MaybePromise<SubmitRequest>;
  nextStageRequirements?: CapabilityRequirement;
}

export interface PipelineTransportOptions {
  stages: readonly PipelineStage[];
}

export interface RacingTransportOptions {
  transports: TransportCollection;
}

export interface HedgedTransportOptions<TTransportId extends string = string> {
  transports: Record<TTransportId, Transport>;
  hedgeDelayMs: number;
  maxAttempts?: number;
  allowUnsafeHedging?: boolean;
}

export interface QuorumFanoutTransportOptions<
  TTransportId extends string = string,
> extends FanoutTransportOptions<TTransportId> {
  quorum: number;
}

export interface LoadBalancingTransportOptions<TTransportId extends string = string> {
  transports: Record<TTransportId, Transport>;
  requiredCapabilities?: CapabilityRequirement;
  strategy?: "round-robin" | "least-loaded" | "random" | "weighted" | "health-weighted";
  weights:
    | Partial<Record<TTransportId, number>>
    | ((request: SubmitRequest, transportId: TTransportId) => MaybePromise<number>);
  healthState?: TransportHealthState<TTransportId>;
}
