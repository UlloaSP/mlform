// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { FormTransition, FormTransitionState, FormTransitionType } from "../types";
import { assertAllowedTransition } from "./engine-transition-rules";
import type { EngineState, EngineTransition } from "./engine-types";

export type {
  EngineState,
  EngineStore,
  EngineTransition,
  InternalFieldState,
} from "./engine-types";

export const createInitialEngineState = (): EngineState => ({
  lifecycle: "active",
  operation: "idle",
  submissionStatus: "idle",
  submitCount: 0,
  lastResult: null,
  formErrors: [],
  fieldStates: {},
  reportStates: {},
  lifecycleVersion: 0,
  activeValidationVersion: 0,
  activeSubmissionVersion: null,
  transitionSequence: 0,
  lastTransition: null,
});

const reduceEngineState = (current: EngineState, transition: EngineTransition): EngineState => {
  switch (transition.type) {
    case "bump-lifecycle":
      return {
        ...current,
        lifecycleVersion: current.lifecycleVersion + 1,
      };
    case "rest":
      return {
        ...current,
        operation: "idle",
      };
    case "editing":
      return {
        ...current,
        operation: "idle",
        formErrors: transition.clearFormErrors ? [] : current.formErrors,
        lifecycleVersion: transition.bumpLifecycle
          ? current.lifecycleVersion + 1
          : current.lifecycleVersion,
      };
    case "start-validation":
      return {
        ...current,
        operation: "validating",
        formErrors: [],
        activeValidationVersion: transition.validationVersion,
      };
    case "validation-error":
      return {
        ...current,
        operation: "idle",
        formErrors: [transition.message],
      };
    case "start-submission":
      return {
        ...current,
        operation: "submitting",
        submissionStatus: "idle",
        submitCount: current.submitCount + 1,
        formErrors: [],
        lastResult: null,
        activeSubmissionVersion: transition.submissionVersion,
      };
    case "submission-success":
      return {
        ...current,
        operation: "idle",
        submissionStatus: "succeeded",
        formErrors: [],
        lastResult: transition.result,
      };
    case "submission-aborted":
      return {
        ...current,
        operation: "idle",
        submissionStatus: "aborted",
        formErrors: [transition.message],
        lastResult: null,
      };
    case "submission-error":
      return {
        ...current,
        operation: "idle",
        submissionStatus: "failed",
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
    case "restore":
      return {
        ...current,
        operation: "idle",
        submissionStatus: "idle",
        submitCount: 0,
        formErrors: [],
        lastResult: null,
        activeSubmissionVersion: null,
        lifecycleVersion:
          transition.type === "restore" ? current.lifecycleVersion + 1 : current.lifecycleVersion,
      };
    case "suspend":
      return {
        ...current,
        lifecycle: "suspended",
        operation: "idle",
        activeSubmissionVersion: null,
        lifecycleVersion: current.lifecycleVersion + 1,
      };
    case "resume":
      return {
        ...current,
        lifecycle: "active",
        lifecycleVersion: current.lifecycleVersion + 1,
      };
    case "dispose":
      return {
        ...current,
        lifecycle: "disposed",
        operation: "idle",
        activeSubmissionVersion: null,
        lifecycleVersion: current.lifecycleVersion + 1,
      };
    default:
      return assertNeverTransition(transition);
  }
};

const publicTransitionType = (transition: EngineTransition): FormTransitionType | undefined => {
  switch (transition.type) {
    case "start-validation":
      return "validation-started";
    case "rest":
      return "validation-finished";
    case "validation-error":
      return "validation-failed";
    case "start-submission":
      return "submission-started";
    case "submission-success":
      return "submission-succeeded";
    case "submission-error":
      return "submission-failed";
    case "submission-aborted":
      return "submission-aborted";
    case "reset":
      return "reset";
    case "restore":
      return "restored";
    case "suspend":
      return "suspended";
    case "resume":
      return "resumed";
    case "dispose":
      return "disposed";
    case "bump-lifecycle":
    case "editing":
    case "clear-active-submission":
      return undefined;
    default:
      return assertNeverTransition(transition);
  }
};

const transitionState = (state: EngineState): FormTransitionState =>
  Object.freeze({
    lifecycle: state.lifecycle,
    operation: state.operation,
    submissionStatus: state.submissionStatus,
    submitCount: state.submitCount,
  });

export const transitionEngineState = (
  current: EngineState,
  transition: EngineTransition,
): EngineState => {
  assertAllowedTransition(current, transition.type);
  const next = reduceEngineState(current, transition);
  const type = publicTransitionType(transition);
  if (!type) return next;

  const sequence = current.transitionSequence + 1;
  const reason = "message" in transition ? transition.message : undefined;
  const event: FormTransition = Object.freeze({
    sequence,
    type,
    from: transitionState(current),
    to: transitionState(next),
    ...(reason === undefined ? {} : { reason }),
  });
  return { ...next, transitionSequence: sequence, lastTransition: event };
};

const assertNeverTransition = (_transition: never): never => {
  throw new Error("Unsupported engine transition.");
};
