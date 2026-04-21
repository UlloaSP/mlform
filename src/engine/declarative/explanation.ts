// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { toPresentationNodes } from "./presentation";
import type {
  DeclarativeExplanationKind,
  ExplanationConfig,
  ExplanationDefinition,
  ExplanationDescriptor,
  ExplanationRenderSpecContext,
  ExplanationStateSnapshot,
  NormalizedExplanationConfig,
} from "../types";

const declarativeExplanationComponent = "declarative-explanation";

const createDescriptor = <TConfig extends ExplanationConfig, TResult>(
  config: NormalizedExplanationConfig<TConfig>,
  state: ExplanationStateSnapshot,
  kind: DeclarativeExplanationKind<TConfig, TResult>,
): ExplanationDescriptor => {
  const renderContext: ExplanationRenderSpecContext<TConfig, TResult> = {
    config,
    explanationId: config.id,
    state,
    result: state.result as TResult,
  };

  return {
    component: declarativeExplanationComponent,
    props: {
      id: config.id,
      kind: config.kind,
      label: config.label ?? config.id,
      description: config.description ?? "",
      result: state.result,
      error: state.error,
      state: state.status,
      summary: kind.render.summary?.(renderContext) ?? null,
      content:
        state.result === undefined && state.error === null
          ? []
          : toPresentationNodes(kind.render.content(renderContext)),
    },
    meta: {
      declarative: true,
    },
  };
};

export const defineExplanationKind = <TConfig extends ExplanationConfig, TResult>(
  kind: DeclarativeExplanationKind<TConfig, TResult>,
): ExplanationDefinition<TConfig> => {
  return {
    kind: kind.kind,
    schema: kind.schema,
    transport: (config) =>
      kind.fetch({
        config: config as NormalizedExplanationConfig<TConfig>,
        explanationId: (config as NormalizedExplanationConfig<TConfig>).id,
      }),
    describe: (config, context) =>
      createDescriptor(config as NormalizedExplanationConfig<TConfig>, context.state, kind),
  };
};
