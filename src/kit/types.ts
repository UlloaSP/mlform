// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type {
  AttachedDesignSystem,
  DesignSystemConfig,
  DesignSystemRegistry,
  ResolvedDesignSystem,
} from "@/design-system";
import type {
  FormController,
  FormHooks,
  FormSchema,
  FormValidator,
  InactiveFieldPolicy,
  Registry,
  Transport,
} from "@/engine";
import type {
  PrimitiveContainerStrategy,
  PrimitiveLayout,
  PrimitiveRegistry,
  PrimitiveReportTransport,
  PrimitiveTextOverrides,
} from "@/primitives";

export type {
  ApiKeyAuthOptions,
  AuthOptions,
  BearerAuthOptions,
  CacheOptions,
  CapabilityRequirement,
  CircuitBreakerOptions,
  CircuitBreakerSharedState,
  CircuitBreakerStateSnapshot,
  CustomAuthOptions,
  DedupOptions,
  FanoutTransportFailure,
  FanoutTransportOptions,
  FanoutTransportResult,
  FallbackTransportFailure,
  FallbackTransportOptions,
  GraphqlTransportOptions,
  GrpcSessionTransportOptions,
  GrpcStreamTransportOptions,
  GrpcTransportOptions,
  GrpcUnaryTransportOptions,
  HedgedTransportOptions,
  JsonTransportMethod,
  JsonTransportOptions,
  LoadBalancingTransportOptions,
  PipelineStage,
  PipelineTransportOptions,
  QuorumFanoutTransportOptions,
  RateLimitLeaseRequest,
  RateLimitOptions,
  RacingTransportOptions,
  RetryOptions,
  RoutingTransportOptions,
  SessionTransportOptions,
  SharedRateLimiter,
  SharedRateLimiterLease,
  SseTransportOptions,
  TransportCacheEntry,
  TransportCacheStore,
  TransportCollection,
  TransportContextAuthOptions,
  TransportHealthSnapshot,
  TransportHealthState,
  TransportLogOptions,
  TransportMetricsOptions,
  TransportMiddleware,
  TransportTelemetryEvent,
  TransportTraceOptions,
  WebSocketSessionTransportOptions,
  WeightedRoutingTransportOptions,
} from "@/transport";

export interface KitDesignSystemSnapshot extends Omit<
  DesignSystemConfig,
  "mode" | "theme" | "recipe"
> {
  mode: NonNullable<DesignSystemConfig["mode"]>;
  theme: NonNullable<DesignSystemConfig["theme"]>;
  recipe: NonNullable<DesignSystemConfig["recipe"]>;
}

export interface KitLabels {
  form?: string;
  reports?: string;
  submit?: string;
  validating?: string;
  submitting?: string;
}

export interface MountFormOptions {
  schema: FormSchema;
  transport: Transport;
  registry?: Registry;
  primitiveRegistry?: PrimitiveRegistry;
  designSystemRegistry?: DesignSystemRegistry;
  designSystem?: DesignSystemConfig;
  initialValues?: Record<string, unknown>;
  validators?: FormValidator[];
  hooks?: FormHooks;
  hookFailurePolicy?: {
    afterSubmit?: "fail-submit" | "preserve-success";
  };
  inactiveFieldPolicy?: InactiveFieldPolicy;
  listenerErrorPolicy?: "ignore" | "throw-aggregate";
  onListenerError?: (error: unknown) => void;
  layout?: PrimitiveLayout;
  containerStrategy?: PrimitiveContainerStrategy;
  reportPane?: "auto" | "always" | "hidden";
  reportTransport?: PrimitiveReportTransport;
  labels?: KitLabels;
  primitiveText?: PrimitiveTextOverrides;
  onDesignSystemChange?: (resolved: ResolvedDesignSystem) => void;
}

export interface MountedForm {
  readonly form: FormController;
  readonly host: HTMLElement;
  readonly engineRegistry: Registry;
  readonly primitiveRegistry: PrimitiveRegistry;
  readonly designSystemRegistry: DesignSystemRegistry;
  readonly designSystem: AttachedDesignSystem;
  updateDesignSystem(config: DesignSystemConfig): void;
  replaceDesignSystem(config: KitDesignSystemSnapshot): void;
  resetDesignSystem(): void;
  unmount(): void;
}
