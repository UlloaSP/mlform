// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { NormalizedFormSchema } from "@/schema";
import type { InternalFieldState, EngineStore } from "../state";
import type {
  FormHooks,
  FormValidationResult,
  InactiveFieldPolicy,
  SubmissionProgressState,
  SubmitOptions,
  SubmitResult,
  Transport,
  TransportStreamEvent,
} from "../types";
import { buildSubmissionValueRecords, type SubmissionValueRecords } from "./request";
import type { SubmissionReport } from "./reports";

export type SubmissionField = Parameters<typeof buildSubmissionValueRecords>[0][number];

export type LiveSubmissionField = SubmissionField & {
  coerceValue(value: unknown): unknown;
  commitState(state: InternalFieldState): void;
};

export type LiveSubmissionReport = SubmissionReport;

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
  onRemoteFieldUpdate?: (fieldId: string) => Promise<void>;
  beforeSubmitRecords?: (records: SubmissionValueRecords) => Promise<void>;
};

export type FormSubmitter = {
  submit(options?: SubmitOptions): Promise<SubmitResult>;
  abort(reason?: string): void;
  reset(): void;
};

export type SubmissionMaps = {
  fieldMap: Map<string, LiveSubmissionField>;
  reportMap: Map<string, LiveSubmissionReport>;
};

export type SubmissionRuntime = {
  store: EngineStore;
  maps: SubmissionMaps;
  onRemoteFieldUpdate?: (fieldId: string) => Promise<void>;
};

export type StreamApplyContext = {
  records: SubmissionValueRecords;
  backend: string | undefined;
};

export type StreamProgressHandler = (
  progress: SubmissionProgressState,
  submissionRequestId: number,
  lifecycleVersion: number,
) => void;

export type StreamEventApplier = (
  event: TransportStreamEvent,
  context: StreamApplyContext,
) => Promise<void>;
