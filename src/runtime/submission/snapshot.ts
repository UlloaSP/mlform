// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { resolveInactiveFieldPolicy } from "../create-runtime-helpers";
import type { FormController, InactiveFieldPolicy } from "../types";
import { buildSubmissionValueRecords, type SubmissionValueRecords } from "./request";

export interface CreateSubmissionSnapshotOptions {
  backend?: string;
  inactiveFieldPolicy?: InactiveFieldPolicy;
}

export type SubmissionSnapshot = SubmissionValueRecords;

export const createSubmissionSnapshot = (
  form: Pick<FormController, "fields">,
  options: CreateSubmissionSnapshotOptions = {},
): SubmissionSnapshot =>
  buildSubmissionValueRecords(form.fields, options.backend, (field) =>
    resolveInactiveFieldPolicy(field, options.inactiveFieldPolicy),
  );

export interface CreateMultiBackendSubmissionSnapshotOptions extends Omit<
  CreateSubmissionSnapshotOptions,
  "backend"
> {
  backends: readonly string[];
}

export const createMultiBackendSubmissionSnapshot = (
  form: Pick<FormController, "fields">,
  options: CreateMultiBackendSubmissionSnapshotOptions,
): Record<string, SubmissionSnapshot> =>
  Object.fromEntries(
    options.backends.map((backend) => [
      backend,
      createSubmissionSnapshot(form, {
        backend,
        inactiveFieldPolicy: options.inactiveFieldPolicy,
      }),
    ]),
  );
