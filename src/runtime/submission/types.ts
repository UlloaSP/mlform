// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { NormalizedFormSchema } from "@/schema";
import type { EngineStore } from "../state";
import type {
  FormHooks,
  FormValidationResult,
  InactiveFieldPolicy,
  SubmitOptions,
  SubmitResult,
  Transport,
} from "../types";
import { buildSubmissionValueRecords, type SubmissionValueRecords } from "./request";
import type { SubmissionReport } from "./reports";

export type SubmissionField = Parameters<typeof buildSubmissionValueRecords>[0][number];

export type SyncDerivedFieldStateOptions = {
  values?: Record<string, unknown>;
  preserveValidationErrors?: boolean;
  preserveExternalErrors?: boolean;
  resetInactiveToInitial?: boolean;
  inactiveFieldPolicy?: InactiveFieldPolicy;
};

export type CreateFormSubmitterOptions = {
  store: EngineStore;
  transport: Transport;
  hooks?: FormHooks;
  hookFailurePolicy?: {
    afterSubmit?: "fail-submit" | "preserve-success";
  };
  normalizedSchema: NormalizedFormSchema;
  fields: readonly SubmissionField[];
  reports: readonly SubmissionReport[];
  validate: () => Promise<FormValidationResult>;
  getSubmitCount: () => number;
  markReportsLoading: () => void;
  resetReports: () => void;
  syncDerivedFieldState: (options?: SyncDerivedFieldStateOptions) => void;
  shouldResetInactiveFields: () => boolean;
  resolveInactiveFieldPolicy: (field: SubmissionField) => InactiveFieldPolicy;
  inactiveFieldPolicy?: InactiveFieldPolicy;
  beforeSubmitRecords?: (records: SubmissionValueRecords) => Promise<void>;
};

export type FormSubmitter = {
  submit(options?: SubmitOptions): Promise<SubmitResult>;
  abort(reason?: string): void;
  reset(): void;
};
