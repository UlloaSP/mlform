// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type {
  ExplanationConfig,
  ExplanationDefinition,
  NormalizedExplanationConfig,
} from "@/schema";
import type {
  DeclarativeExplanationKind,
  ExplanationDescriptor,
  ExplanationDescriptorContext,
  ExplanationPresenter,
} from "./index";
import { toPresentationNodes } from "./types/presentation";

export type DefinedExplanationKind<TConfig extends ExplanationConfig, _TResult> = {
  kind: string;
  schema: import("zod").ZodType<TConfig>;
  transport: ExplanationDefinition<TConfig>["transport"];
  describe?: (
    config: NormalizedExplanationConfig<TConfig>,
    context: ExplanationDescriptorContext,
  ) => ExplanationDescriptor | null;
  definition: ExplanationDefinition<TConfig>;
  presenter: ExplanationPresenter<TConfig>;
};

export const defineExplanationKind = <TConfig extends ExplanationConfig, TResult>(
  kind: DeclarativeExplanationKind<TConfig, TResult>,
): DefinedExplanationKind<TConfig, TResult> => {
  const definition: ExplanationDefinition<TConfig> = {
    kind: kind.kind,
    schema: kind.schema,
    transport: (config) =>
      kind.fetch({
        config: config as TConfig & { id: string },
        explanationId: (config as TConfig & { id: string }).id,
      }),
  };

  const presenter: ExplanationPresenter<TConfig> = {
    kind: kind.kind,
    describe(config, context) {
      const renderContext = {
        config,
        explanationId: config.id,
        state: context.state,
        result: context.state.result as TResult,
      };

      return {
        component: "declarative-explanation",
        props: {
          id: config.id,
          kind: config.kind,
          label: config.label ?? config.id,
          description: config.description ?? "",
          result: context.state.result,
          error: context.state.error,
          state: context.state.status,
          summary: kind.render.summary?.(renderContext) ?? null,
          content:
            context.state.result === undefined && context.state.error === null
              ? []
              : toPresentationNodes(kind.render.content(renderContext)),
        },
        meta: {
          declarative: true,
        },
      };
    },
  };

  const describe = presenter.describe.bind(presenter);

  Object.assign(definition as unknown as Record<string, unknown>, {
    describe,
  });

  return {
    kind: kind.kind,
    schema: kind.schema,
    transport: definition.transport,
    describe,
    definition,
    presenter,
  };
};
