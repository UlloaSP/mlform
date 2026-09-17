// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { resolveInactiveFieldPolicy } from "../create-runtime-helpers";
import type { FormController, InactiveFieldPolicy } from "../types";
import type { InternalFieldController } from "../fields";
import { deepFreeze } from "../utils";
import { buildSubmissionValueRecords } from "./request";
import { assertBackendIdentity, assertUniqueBackendIdentities } from "./backend";
import type { ReadonlySubmissionInputRecord } from "@/schema";

export interface CreateSubmissionSnapshotOptions {
  backend?: string;
  inactiveFieldPolicy?: InactiveFieldPolicy;
}

export interface SubmissionSnapshot {
  readonly inputs: readonly ReadonlySubmissionInputRecord[];
  readonly displayValues: Readonly<Record<string, unknown>>;
  readonly modelValues: Readonly<Record<string, unknown>>;
}

export const createSubmissionSnapshot = (
  form: Pick<FormController, "fields">,
  options: CreateSubmissionSnapshotOptions = {},
): SubmissionSnapshot => {
  assertBackendIdentity(options.backend);
  return deepFreeze(
    buildSubmissionValueRecords(
      form.fields as readonly InternalFieldController[],
      options.backend,
      (field) => resolveInactiveFieldPolicy(field, options.inactiveFieldPolicy),
    ),
  );
};

export interface CreateMultiBackendSubmissionSnapshotOptions extends Omit<
  CreateSubmissionSnapshotOptions,
  "backend"
> {
  backends: readonly string[];
}

export const createMultiBackendSubmissionSnapshot = (
  form: Pick<FormController, "fields">,
  options: CreateMultiBackendSubmissionSnapshotOptions,
): Readonly<Record<string, SubmissionSnapshot>> => {
  assertUniqueBackendIdentities(options.backends);
  return deepFreeze(
    Object.fromEntries(
      options.backends.map((backend) => [
        backend,
        createSubmissionSnapshot(form, {
          backend,
          inactiveFieldPolicy: options.inactiveFieldPolicy,
        }),
      ]),
    ),
  );
};
