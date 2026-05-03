// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

export type {
  BaseExplanationConfig,
  ExplanationConfig,
  ExplanationFetchContext,
  ExplanationFetchFactory,
  ExplanationFetchRequest,
  ExplanationFetchTransport,
  ExplanationStateSnapshot,
  ExplanationStatus,
} from "@/schema";

import type {
  ExplanationDefinition as SchemaExplanationDefinition,
  ExplanationFetchRequest,
  ExplanationStateSnapshot,
  NormalizedExplanationConfig as SchemaNormalizedExplanationConfig,
} from "@/schema";
import type { ExplanationDescriptor } from "@/presentation";

export interface ExplanationHandle {
  readonly id: string;
  readonly kind: string;
  readonly config: SchemaNormalizedExplanationConfig;
  readonly state: ExplanationStateSnapshot;
  fetch(request: ExplanationFetchRequest): Promise<void>;
  abort(): void;
  reset(): void;
  subscribe(listener: (state: ExplanationStateSnapshot) => void): () => void;
}

export type ExplanationController = ExplanationHandle;
export type ExplanationDefinition<
  TConfig extends import("@/schema").ExplanationConfig = import("@/schema").ExplanationConfig,
> = SchemaExplanationDefinition<TConfig> & {
  describe?: (
    config: SchemaNormalizedExplanationConfig<TConfig>,
    context: { explanationId: string; state: ExplanationStateSnapshot },
  ) => ExplanationDescriptor | null;
  [key: string]: unknown;
};

export type NormalizedExplanationConfig<
  TConfig extends import("@/schema").ExplanationConfig = import("@/schema").ExplanationConfig,
> = SchemaNormalizedExplanationConfig<TConfig>;
