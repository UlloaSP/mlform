// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { FormController } from "@/engine";
import type { IQuestionnaireController, NormalizedStepConfig, QuestionnaireState } from "../types";

export class QuestionnaireController implements IQuestionnaireController {
  readonly #form: FormController;
  readonly #steps: readonly NormalizedStepConfig[];
  #stepIndex = 0;
  readonly #listeners = new Set<(state: QuestionnaireState) => void>();

  constructor(form: FormController, steps: readonly NormalizedStepConfig[]) {
    this.#form = form;
    this.#steps = steps;
  }

  get steps(): readonly NormalizedStepConfig[] {
    return this.#steps;
  }

  get form(): FormController {
    return this.#form;
  }

  get state(): QuestionnaireState {
    return this.#buildState();
  }

  async next(): Promise<boolean> {
    const currentStep = this.#steps[this.#stepIndex];

    if (!currentStep) {
      return false;
    }

    // Validate only current step's fields — avoids touching future-step fields
    const fieldControllers = currentStep.fieldIds
      .map((id) => this.#form.getField(id))
      .filter((f): f is NonNullable<typeof f> => f !== undefined && f.state.visible);

    const results = await Promise.all(fieldControllers.map((field) => field.validate()));
    const hasErrors = results.some((result) => result.errors.length > 0);

    if (hasErrors) {
      return false;
    }

    if (this.#stepIndex < this.#steps.length - 1) {
      this.#stepIndex++;
      this.#notify();
    }

    return true;
  }

  prev(): void {
    if (this.#stepIndex > 0) {
      this.#stepIndex--;
      this.#notify();
    }
  }

  subscribe(listener: (state: QuestionnaireState) => void): () => void {
    this.#listeners.add(listener);
    return () => {
      this.#listeners.delete(listener);
    };
  }

  #notify(): void {
    const state = this.#buildState();
    for (const listener of this.#listeners) {
      listener(state);
    }
  }

  #buildState(): QuestionnaireState {
    const total = this.#steps.length;
    const stepIndex = this.#stepIndex;
    const currentStep = this.#steps[stepIndex];

    if (!currentStep) {
      throw new Error("QuestionnaireController: invalid step index.");
    }

    return {
      stepIndex,
      canGoNext: stepIndex < total - 1,
      canGoPrev: stepIndex > 0,
      isLastStep: stepIndex === total - 1,
      stepProgress: {
        current: stepIndex + 1,
        total,
      },
      currentStep,
    };
  }
}
