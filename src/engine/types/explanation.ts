// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { ZodType } from "zod";

export type ExplanationStatus = "idle" | "loading" | "done" | "error";

export interface BaseExplanationConfig {
  id?: string;
  kind: string;
  label?: string;
  description?: string;
  [key: string]: unknown;
}

export type ExplanationConfig = BaseExplanationConfig;

export type NormalizedExplanationConfig<TConfig extends ExplanationConfig = ExplanationConfig> =
  TConfig & { id: string };

export interface ExplanationStateSnapshot {
  status: ExplanationStatus;
  result: unknown;
  error: string | null;
}

export interface ExplanationDescriptor {
  component: string;
  props: Record<string, unknown>;
  meta?: Record<string, unknown>;
}

export interface ExplanationDescriptorContext {
  explanationId: string;
  state: ExplanationStateSnapshot;
}

/**
 * Minimal transport interface used to fetch explanation data from an external
 * service. Defined in engine types so ExplanationController can reference it
 * without a circular dependency on the primitives layer.
 */
export interface ExplanationFetchRequest {
  explanationId: string;
  backend?: string;
  values: Record<string, unknown>;
  fieldValues: Record<string, unknown>;
  serializedValues: Record<string, unknown>;
  serializedFieldValues: Record<string, unknown>;
  reports: Record<string, unknown>;
  meta: Record<string, unknown>;
  raw: unknown;
  signal?: AbortSignal;
}

export interface ExplanationFetchTransport {
  submit: (request: ExplanationFetchRequest) => Promise<unknown>;
}

/**
 * Plugin definition for an explanation kind. Each explanation plugin must
 * provide a Zod schema for its config, a transport factory, and a describe
 * function that returns a descriptor for primitive rendering.
 */
export interface ExplanationDefinition<TConfig extends ExplanationConfig = ExplanationConfig> {
  kind: string;
  schema: ZodType<TConfig>;
  /**
   * Factory that returns the transport used to fetch this explanation's data.
   * Called with the normalized explanation config when a fetch is triggered.
   */
  transport: (config: TConfig) => ExplanationFetchTransport;
  describe: (
    config: TConfig,
    context: ExplanationDescriptorContext,
  ) => ExplanationDescriptor | null;
}

/**
 * Runtime controller for a single explanation instance. Tracks fetch
 * lifecycle state and exposes a subscribe API consistent with
 * FieldController / ReportController.
 */
export interface ExplanationController {
  readonly id: string;
  readonly kind: string;
  readonly config: NormalizedExplanationConfig;
  readonly state: ExplanationStateSnapshot;
  readonly descriptor: ExplanationDescriptor | null;
  /**
   * Trigger an explanation fetch using the definition's transport. The
   * request must contain the full submit result context; the controller
   * appends an AbortSignal internally.
   * Idempotent when status is not "idle" — call reset() first to refetch.
   */
  fetch(request: ExplanationFetchRequest): Promise<void>;
  /** Abort any in-flight fetch and reset state to "idle". */
  abort(): void;
  /** Reset state to "idle" without aborting (use before re-submission). */
  reset(): void;
  subscribe(listener: (state: ExplanationStateSnapshot) => void): () => void;
}
