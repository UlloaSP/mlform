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

export interface ExplanationFetchContext<TConfig extends ExplanationConfig = ExplanationConfig> {
  config: NormalizedExplanationConfig<TConfig>;
  explanationId: string;
}

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

export type ExplanationFetchFactory<TConfig extends ExplanationConfig = ExplanationConfig> = (
  context: ExplanationFetchContext<TConfig>,
) => ExplanationFetchTransport;

export interface ExplanationDefinition<TConfig extends ExplanationConfig = ExplanationConfig> {
  kind: string;
  schema: ZodType<TConfig>;
  transport: (config: TConfig) => ExplanationFetchTransport;
}
