// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type {
  AttachedDesignSystem,
  DesignSystemConfig,
  DesignSystemRegistry,
  ResolvedDesignSystem,
} from "@/design-system";
import type {
  FieldConfig,
  FieldController,
  FormController,
  FormHooks,
  FormValidator,
  InactiveFieldPolicy,
  Registry,
  Transport,
} from "@/engine";
import type { PrimitiveRegistry, PrimitiveTextOverrides } from "@/primitives";
import type {
  QuestionnaireLabels,
  QuestionnaireText,
  QuestionnaireTextOverrides,
} from "./constants";

export type { QuestionnaireLabels, QuestionnaireText, QuestionnaireTextOverrides };

// ── Schema ──────────────────────────────────────────────────────────────────

export interface QuestionnaireStepConfig {
  id?: string;
  title: string;
  description?: string;
  fields: FieldConfig[];
}

export interface QuestionnaireSchema {
  steps: QuestionnaireStepConfig[];
}

export interface NormalizedStepConfig {
  id: string;
  title: string;
  description?: string;
  fieldIds: string[];
}

// ── Controller ───────────────────────────────────────────────────────────────

export interface QuestionnaireStepProgress {
  current: number;
  total: number;
}

export interface QuestionnaireState {
  stepIndex: number;
  canGoNext: boolean;
  canGoPrev: boolean;
  isLastStep: boolean;
  stepProgress: QuestionnaireStepProgress;
  currentStep: NormalizedStepConfig;
}

export interface IQuestionnaireController {
  readonly steps: readonly NormalizedStepConfig[];
  readonly state: QuestionnaireState;
  readonly form: FormController;
  next(): Promise<boolean>;
  prev(): void;
  subscribe(listener: (state: QuestionnaireState) => void): () => void;
}

// ── Visible step fields ───────────────────────────────────────────────────────

export type StepFieldEntry = {
  id: string;
  controller: FieldController;
};

// ── Mount ─────────────────────────────────────────────────────────────────────

export interface MountQuestionnaireOptions {
  schema: QuestionnaireSchema;
  transport: Transport;
  registry?: Registry;
  primitiveRegistry?: PrimitiveRegistry;
  designSystem?: DesignSystemConfig;
  designSystemRegistry?: DesignSystemRegistry;
  initialValues?: Record<string, unknown>;
  validators?: FormValidator[];
  hooks?: FormHooks;
  inactiveFieldPolicy?: InactiveFieldPolicy;
  listenerErrorPolicy?: "ignore" | "throw-aggregate";
  onListenerError?: (error: unknown) => void;
  labels?: QuestionnaireLabels;
  text?: QuestionnaireTextOverrides;
  primitiveText?: PrimitiveTextOverrides;
  onDesignSystemChange?: (resolved: ResolvedDesignSystem) => void;
}

export interface MountedQuestionnaire {
  readonly controller: IQuestionnaireController;
  readonly form: FormController;
  readonly host: HTMLElement;
  readonly designSystem: AttachedDesignSystem;
  unmount(): void;
}
