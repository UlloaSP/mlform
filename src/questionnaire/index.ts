// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

export { mountQuestionnaire, unmountQuestionnaire } from "./mount";
export { QuestionnaireController } from "./engine/controller";
export { createQuestionnaireSchema, normalizeQuestionnaireSchema } from "./engine/schema";
export { QuestionnaireError } from "./errors";
export {
  questionnaireDefaultLabels,
  questionnaireEventNames,
  questionnaireStaticText,
  questionnaireTagNames,
  resolveQuestionnaireText,
} from "./constants";
export type {
  IQuestionnaireController,
  MountedQuestionnaire,
  MountQuestionnaireOptions,
  NormalizedStepConfig,
  QuestionnaireLabels,
  QuestionnaireSchema,
  QuestionnaireState,
  QuestionnaireStepConfig,
  QuestionnaireStepProgress,
  QuestionnaireText,
  QuestionnaireTextOverrides,
} from "./types";
