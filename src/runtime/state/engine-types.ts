// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type {
  FieldStateSnapshot,
  FormLifecycle,
  FormOperation,
  FormSubmissionStatus,
  FormTransition,
  ReportStateSnapshot,
  SubmitResult,
} from "../types";
import type { Store } from "./store";

export interface InternalFieldState extends FieldStateSnapshot {
  syncErrors: string[];
  validationErrors: string[];
  externalErrors: string[];
  validationVersion: number;
}

export interface EngineState {
  lifecycle: FormLifecycle;
  operation: FormOperation;
  submissionStatus: FormSubmissionStatus;
  submitCount: number;
  lastResult: SubmitResult | null;
  formErrors: string[];
  fieldStates: Record<string, InternalFieldState>;
  reportStates: Record<string, ReportStateSnapshot>;
  lifecycleVersion: number;
  activeValidationVersion: number;
  activeSubmissionVersion: number | null;
  transitionSequence: number;
  lastTransition: FormTransition | null;
}

export interface EngineStore extends Store<EngineState> {
  subscribeTransitions(listener: (transition: FormTransition) => void): () => void;
}

export type EngineTransition =
  | { type: "bump-lifecycle" }
  | { type: "rest" }
  | { type: "editing"; clearFormErrors?: boolean; bumpLifecycle?: boolean }
  | { type: "start-validation"; validationVersion: number }
  | { type: "validation-error"; message: string }
  | { type: "start-submission"; submissionVersion: number }
  | { type: "submission-success"; result: SubmitResult }
  | { type: "submission-aborted"; message: string }
  | { type: "submission-error"; message: string }
  | { type: "clear-active-submission"; submissionVersion: number }
  | { type: "reset" }
  | { type: "restore" }
  | { type: "suspend"; message?: string }
  | { type: "resume" }
  | { type: "dispose" };
