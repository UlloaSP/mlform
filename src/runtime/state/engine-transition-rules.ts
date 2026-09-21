// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { EngineState, EngineTransition } from "./engine-types";

export const assertAllowedTransition = (
  state: EngineState,
  transitionType: EngineTransition["type"],
): void => {
  const { lifecycle, operation, submissionStatus } = state;
  const active = lifecycle === "active";
  const allowed = (() => {
    switch (transitionType) {
      case "bump-lifecycle":
      case "editing":
      case "reset":
      case "restore":
        return active;
      case "suspend":
        return active;
      case "resume":
        return lifecycle === "suspended";
      case "dispose":
        return lifecycle !== "disposed";
      case "rest":
        return active && operation === "validating";
      case "start-validation":
        return active && operation === "idle";
      case "validation-error":
        return active && operation === "validating";
      case "start-submission":
        return active && operation === "idle";
      case "submission-success":
        return active && operation === "submitting";
      case "submission-aborted":
        return (
          active &&
          (operation === "validating" ||
            operation === "submitting" ||
            (operation === "idle" && submissionStatus === "succeeded"))
        );
      case "submission-error":
        return (
          active &&
          (operation === "validating" ||
            operation === "submitting" ||
            (operation === "idle" && submissionStatus === "succeeded"))
        );
      case "clear-active-submission":
        return lifecycle !== "disposed";
      default:
        return assertNeverTransitionType(transitionType);
    }
  })();

  if (!allowed) {
    throw new Error(
      `Invalid engine transition "${transitionType}" from lifecycle "${lifecycle}", operation "${operation}", submission "${submissionStatus}".`,
    );
  }
};

const assertNeverTransitionType = (_transitionType: never): never => {
  throw new Error("Unsupported engine transition type.");
};
