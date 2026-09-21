// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { FormLifecycle, FormOperation, FormSubmissionStatus } from "@/schema";

export type FormTransitionType =
  | "validation-started"
  | "validation-finished"
  | "validation-failed"
  | "submission-started"
  | "submission-succeeded"
  | "submission-failed"
  | "submission-aborted"
  | "reset"
  | "restored"
  | "suspended"
  | "resumed"
  | "disposed";

export interface FormTransitionState {
  lifecycle: FormLifecycle;
  operation: FormOperation;
  submissionStatus: FormSubmissionStatus;
  submitCount: number;
}

export interface FormTransition {
  sequence: number;
  type: FormTransitionType;
  from: FormTransitionState;
  to: FormTransitionState;
  reason?: string;
}
