// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { FormValidationResult } from "./types";

export class EngineError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EngineError";
  }
}

export class RegistryError extends EngineError {
  constructor(message: string) {
    super(message);
    this.name = "RegistryError";
  }
}

export class ValidationError extends EngineError {
  readonly result: FormValidationResult;

  constructor(result: FormValidationResult) {
    super("Form validation failed.");
    this.name = "ValidationError";
    this.result = result;
  }
}

export class SubmitError extends EngineError {
  readonly cause: unknown;

  constructor(message: string, cause: unknown) {
    super(message);
    this.name = "SubmitError";
    this.cause = cause;
  }
}

export class SubmissionAbortedError extends SubmitError {
  constructor(message = "Form submission was aborted.", cause?: unknown) {
    super(message, cause);
    this.name = "SubmissionAbortedError";
  }
}
