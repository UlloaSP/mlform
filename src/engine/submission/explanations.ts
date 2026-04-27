// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { ExplanationExecutionContext, ExplanationExecutionResult } from "../types";

const unknownExplanationError = "Unknown explanation error.";

export const executeExplanations = async ({
  explanations,
  request,
}: ExplanationExecutionContext): Promise<ExplanationExecutionResult> => {
  if (explanations.length === 0) {
    return {
      results: {},
      errors: {},
    };
  }

  for (const explanation of explanations) {
    explanation.reset();
  }

  await Promise.allSettled(
    explanations.map((explanation) =>
      explanation.fetch({
        ...request,
        explanationId: explanation.id,
      }),
    ),
  );

  const results: Record<string, unknown> = {};
  const errors: Record<string, string> = {};

  for (const explanation of explanations) {
    const state = explanation.state;
    if (state.status === "done") {
      results[explanation.id] = state.result;
      continue;
    }

    if (state.status === "error") {
      errors[explanation.id] = state.error ?? unknownExplanationError;
    }
  }

  return {
    results,
    errors,
  };
};
