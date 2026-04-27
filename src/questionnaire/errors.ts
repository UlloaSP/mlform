// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

export class QuestionnaireError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "QuestionnaireError";
  }
}
