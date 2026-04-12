// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { FieldStateSnapshot, FormStatus, ReportStateSnapshot, SubmitResult } from "../types";
import type { Store } from "./store";

export interface InternalFieldState extends FieldStateSnapshot {
  syncErrors: string[];
  validationErrors: string[];
  externalErrors: string[];
  validationVersion: number;
}

export interface EngineState {
  status: FormStatus;
  submitCount: number;
  lastResult: SubmitResult | null;
  formErrors: string[];
  fieldStates: Record<string, InternalFieldState>;
  reportStates: Record<string, ReportStateSnapshot>;
  lifecycleVersion: number;
  activeValidationVersion: number;
  activeSubmissionVersion: number | null;
}

export type EngineStore = Store<EngineState>;

export type EngineTransition =
  | { type: "bump-lifecycle" }
  | { type: "rest"; status: "idle" | "editing" }
  | { type: "editing"; clearFormErrors?: boolean; bumpLifecycle?: boolean }
  | { type: "start-validation"; validationVersion: number }
  | { type: "validation-error"; message: string }
  | { type: "start-submission"; submissionVersion: number }
  | { type: "submission-success"; result: SubmitResult }
  | { type: "submission-aborted"; message: string }
  | { type: "submission-error"; message: string }
  | { type: "clear-active-submission"; submissionVersion: number }
  | { type: "reset" };

export const createInitialEngineState = (): EngineState => ({
  status: "idle",
  submitCount: 0,
  lastResult: null,
  formErrors: [],
  fieldStates: {},
  reportStates: {},
  lifecycleVersion: 0,
  activeValidationVersion: 0,
  activeSubmissionVersion: null,
});

export const transitionEngineState = (
  current: EngineState,
  transition: EngineTransition,
): EngineState => {
  assertAllowedTransition(current.status, transition.type);

  switch (transition.type) {
    case "bump-lifecycle":
      return {
        ...current,
        lifecycleVersion: current.lifecycleVersion + 1,
      };
    case "rest":
      return {
        ...current,
        status: transition.status,
      };
    case "editing":
      return {
        ...current,
        status: "editing",
        formErrors: transition.clearFormErrors ? [] : current.formErrors,
        lifecycleVersion: transition.bumpLifecycle
          ? current.lifecycleVersion + 1
          : current.lifecycleVersion,
      };
    case "start-validation":
      return {
        ...current,
        status: "validating",
        formErrors: [],
        activeValidationVersion: transition.validationVersion,
      };
    case "validation-error":
      return {
        ...current,
        status: "error",
        formErrors: [transition.message],
      };
    case "start-submission":
      return {
        ...current,
        status: "submitting",
        submitCount: current.submitCount + 1,
        formErrors: [],
        lastResult: null,
        activeSubmissionVersion: transition.submissionVersion,
      };
    case "submission-success":
      return {
        ...current,
        status: "success",
        formErrors: [],
        lastResult: transition.result,
      };
    case "submission-aborted":
      return {
        ...current,
        status: "idle",
        formErrors: [transition.message],
        lastResult: null,
      };
    case "submission-error":
      return {
        ...current,
        status: "error",
        formErrors: [transition.message],
        lastResult: null,
      };
    case "clear-active-submission":
      return {
        ...current,
        activeSubmissionVersion:
          current.activeSubmissionVersion === transition.submissionVersion
            ? null
            : current.activeSubmissionVersion,
      };
    case "reset":
      return {
        ...current,
        status: "idle",
        submitCount: 0,
        formErrors: [],
        lastResult: null,
        activeSubmissionVersion: null,
      };
    default:
      return assertNeverTransition(transition);
  }
};

const assertNeverTransition = (_transition: never): never => {
  throw new Error("Unsupported engine transition.");
};

const assertAllowedTransition = (
  status: FormStatus,
  transitionType: EngineTransition["type"],
): void => {
  const allowed =
    transitionType === "submission-success" || transitionType === "submission-aborted"
      ? status === "submitting"
      : transitionType === "submission-error"
        ? status === "submitting" || status === "success"
        : transitionType === "validation-error"
          ? status === "validating"
          : true;

  if (!allowed) {
    throw new Error(`Invalid engine transition "${transitionType}" from status "${status}".`);
  }
};
