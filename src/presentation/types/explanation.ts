// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type {
  ExplanationConfig,
  ExplanationFetchFactory,
  ExplanationStateSnapshot,
  NormalizedExplanationConfig,
} from "@/schema";
import type { ZodType } from "zod";
import type { PresentationContent, PresentationSummary } from "./presentation";

export interface ExplanationDescriptor {
  component: string;
  props: Record<string, unknown>;
  meta?: Record<string, unknown>;
}

export interface ExplanationDescriptorContext {
  explanationId: string;
  state: ExplanationStateSnapshot;
}

export interface ExplanationRenderSpecContext<
  TConfig extends ExplanationConfig = ExplanationConfig,
  TResult = unknown,
> {
  config: NormalizedExplanationConfig<TConfig>;
  explanationId: string;
  state: ExplanationStateSnapshot;
  result: TResult;
}

export interface ExplanationRenderSpec<
  TConfig extends ExplanationConfig = ExplanationConfig,
  TResult = unknown,
> {
  summary?: (
    context: ExplanationRenderSpecContext<TConfig, TResult>,
  ) => PresentationSummary | undefined;
  content: (context: ExplanationRenderSpecContext<TConfig, TResult>) => PresentationContent;
}

export interface DeclarativeExplanationKind<
  TConfig extends ExplanationConfig = ExplanationConfig,
  TResult = unknown,
> {
  kind: string;
  schema: ZodType<TConfig>;
  fetch: ExplanationFetchFactory<TConfig>;
  render: ExplanationRenderSpec<TConfig, TResult>;
}

export interface ExplanationPresenter<TConfig extends ExplanationConfig = ExplanationConfig> {
  kind: string;
  describe(
    config: NormalizedExplanationConfig<TConfig>,
    context: ExplanationDescriptorContext,
  ): ExplanationDescriptor | null;
}
