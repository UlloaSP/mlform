// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

export type TransportAuthKind =
  | "none"
  | "api-key"
  | "bearer"
  | "basic"
  | "oauth2"
  | "mtls"
  | "transport-context"
  | "custom";

export type TransportConsistency = "unknown" | "at-most-once" | "at-least-once" | "best-effort";

export type TransportDeliveryMode = "request-response" | "stream" | "session";

export type TransportBackpressureMode = "none" | "consumer-pull" | "bounded-buffer";

export interface TransportCapabilities {
  modes: {
    submit: boolean;
    stream: boolean;
    session: boolean;
  };
  safety: {
    idempotent: boolean;
    retrySafe: boolean;
    cacheable: boolean;
    hedgeSafe: boolean;
  };
  limits: {
    maxPayloadBytes?: number;
    maxBufferedMessages?: number;
  };
  auth: {
    kinds: readonly TransportAuthKind[];
  };
  delivery: {
    mode: TransportDeliveryMode;
    consistency: TransportConsistency;
    backpressure: TransportBackpressureMode;
  };
}

export interface CapabilityRequirement {
  modes?: Partial<TransportCapabilities["modes"]>;
  safety?: Partial<TransportCapabilities["safety"]>;
  authKinds?: readonly TransportAuthKind[];
  maxPayloadBytes?: number;
}
