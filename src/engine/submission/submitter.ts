// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import {
  createAbortError,
  isAbortLikeError,
  SubmissionAbortedError,
  SubmitError,
  ValidationError,
} from "../errors";
import type { NormalizedFormSchema } from "../schema";
import type { EngineStore } from "../state";
import type {
  FormHooks,
  FormTransportConfig,
  FormValidationResult,
  InactiveFieldPolicy,
  SubmitOptions,
  SubmitResult,
} from "../types";
import { createSubmissionAbortManager } from "./abort";
import { createSubmissionLifecycle } from "./lifecycle";
import {
  buildSubmissionValueRecords,
  cloneSubmissionValueRecords,
  normalizeTransportResponse,
  type SubmissionValueRecords,
} from "./request";
import { cloneSubmissionResult, createSubmissionResult } from "./result";
import { commitReportStates, prepareReportStates, type SubmissionReport } from "./reports";
import { resolveSubmitTransport } from "./router";

type SubmissionField = Parameters<typeof buildSubmissionValueRecords>[0][number];

type SyncDerivedFieldStateOptions = {
  values?: Record<string, unknown>;
  preserveValidationErrors?: boolean;
  preserveExternalErrors?: boolean;
  resetInactiveToInitial?: boolean;
  inactiveFieldPolicy?: InactiveFieldPolicy;
};

type CreateFormSubmitterOptions = FormTransportConfig & {
  store: EngineStore;
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
};

export type FormSubmitter = {
  submit(options?: SubmitOptions): Promise<SubmitResult>;
  abort(reason?: string): void;
  reset(): void;
};

export const createFormSubmitter = ({
  store,
  hooks,
  hookFailurePolicy,
  normalizedSchema,
  fields,
  reports,
  validate,
  getSubmitCount,
  markReportsLoading,
  resetReports,
  syncDerivedFieldState,
  shouldResetInactiveFields,
  resolveInactiveFieldPolicy,
  inactiveFieldPolicy,
  ...transportConfig
}: CreateFormSubmitterOptions): FormSubmitter => {
  const abortManager = createSubmissionAbortManager();

  const syncAfterSubmissionTransition = () => {
    syncDerivedFieldState({
      preserveValidationErrors: true,
      preserveExternalErrors: true,
      resetInactiveToInitial: shouldResetInactiveFields(),
      inactiveFieldPolicy,
    });
  };

  const lifecycle = createSubmissionLifecycle({
    store,
    resetReports,
    syncAfterSubmissionTransition,
  });

  const notifySubmitError = async (
    backend: string | undefined,
    records: SubmissionValueRecords,
    submitCount: number,
    error: unknown,
  ): Promise<void> => {
    const publicRecords = cloneSubmissionValueRecords(records);
    await hooks?.onSubmitError?.({
      backend,
      ...publicRecords,
      submitCount,
      error,
    });
  };

  const handleSubmissionAbort = async (
    error: unknown,
    submissionRequestId: number,
    lifecycleVersion: number,
    submitCount: number,
    records: SubmissionValueRecords,
    backend: string | undefined,
  ): Promise<never> => {
    const abortedError =
      error instanceof SubmissionAbortedError
        ? error
        : createAbortError(abortManager.getAbortReason(submissionRequestId));

    if (
      abortManager.getCurrentRequestId() === submissionRequestId &&
      store.getState().lifecycleVersion === lifecycleVersion
    ) {
      lifecycle.abort(abortedError.message);
    }

    await notifySubmitError(backend, records, submitCount, abortedError);
    throw abortedError;
  };

  const handleSubmissionError = async (
    error: unknown,
    submissionRequestId: number,
    lifecycleVersion: number,
    submitCount: number,
    records: SubmissionValueRecords,
    backend: string | undefined,
  ): Promise<never> => {
    const message = error instanceof Error ? error.message : String(error);

    if (
      abortManager.getCurrentRequestId() === submissionRequestId &&
      store.getState().lifecycleVersion === lifecycleVersion
    ) {
      lifecycle.fail(message);
    }

    await notifySubmitError(backend, records, submitCount, error);
    throw new SubmitError(`Form submission failed: ${message}`, error);
  };

  return {
    async submit(options) {
      abortManager.ensureIdle();
      const submissionRequestId = abortManager.begin();

      let selectedTransport;
      try {
        selectedTransport = resolveSubmitTransport(transportConfig, options);
      } catch (error) {
        abortManager.clear(submissionRequestId);
        throw error;
      }

      let validation: FormValidationResult;
      try {
        validation = await validate();
      } catch (error) {
        abortManager.clear(submissionRequestId);
        throw error;
      }

      if (abortManager.getCurrentRequestId() !== submissionRequestId) {
        abortManager.clear(submissionRequestId);
        throw createAbortError(abortManager.getAbortReason(submissionRequestId) || "superseded");
      }

      if (!validation.valid) {
        abortManager.clear(submissionRequestId);
        throw new ValidationError(validation);
      }

      if (options?.signal?.aborted) {
        abortManager.clear(submissionRequestId);
        throw createAbortError(String(options.signal.reason ?? ""));
      }

      const records = buildSubmissionValueRecords(fields, resolveInactiveFieldPolicy);
      abortManager.setActiveController(
        submissionRequestId,
        typeof AbortController !== "undefined" ? new AbortController() : null,
      );
      abortManager.attachExternalSignal(options, submissionRequestId);

      store.batch(() => {
        markReportsLoading();
        lifecycle.start(submissionRequestId);
      });

      const submitCount = getSubmitCount();
      const lifecycleVersion = store.getState().lifecycleVersion;
      const submitSignal = abortManager.createSignal(options);

      try {
        const beforeSubmitRecords = cloneSubmissionValueRecords(records);
        await hooks?.beforeSubmit?.({
          backend: selectedTransport.backend,
          ...beforeSubmitRecords,
          submitCount,
          signal: submitSignal,
        });

        if (submitSignal.aborted || abortManager.isAborted(submissionRequestId)) {
          throw createAbortError(abortManager.getAbortReason(submissionRequestId));
        }

        const transportRecords = cloneSubmissionValueRecords(records);
        const response = await selectedTransport.transport.submit({
          backend: selectedTransport.backend,
          ...transportRecords,
          fields: normalizedSchema.fields,
          reports: normalizedSchema.reports,
          signal: submitSignal,
        });

        const stillCurrent =
          abortManager.getCurrentRequestId() === submissionRequestId &&
          store.getState().lifecycleVersion === lifecycleVersion &&
          !submitSignal.aborted &&
          !abortManager.isAborted(submissionRequestId);

        if (!stillCurrent) {
          throw createAbortError(abortManager.getAbortReason(submissionRequestId));
        }

        const normalizedResponse = normalizeTransportResponse(response);
        const baseResult: Omit<SubmitResult, "reportStates"> = {
          backend: selectedTransport.backend,
          ...records,
          reports: normalizedResponse.reports ?? {},
          meta: normalizedResponse.meta ?? {},
          raw: normalizedResponse.raw,
        };
        const nextReportStates = await prepareReportStates(reports, {
          ...baseResult,
          reportStates: {},
        });
        const result = createSubmissionResult(reports, baseResult, nextReportStates);

        const storedResult = cloneSubmissionResult(reports, result);
        store.batch(() => {
          commitReportStates(reports, nextReportStates);
          lifecycle.succeed(storedResult);
        });

        try {
          const afterSubmitRecords = cloneSubmissionValueRecords(records);
          await hooks?.afterSubmit?.({
            backend: selectedTransport.backend,
            ...afterSubmitRecords,
            submitCount,
            result: cloneSubmissionResult(reports, result),
          });
        } catch (error) {
          if (hookFailurePolicy?.afterSubmit !== "preserve-success") {
            throw error;
          }

          await notifySubmitError(selectedTransport.backend, records, submitCount, error);
        }

        return cloneSubmissionResult(reports, result);
      } catch (error) {
        if (
          isAbortLikeError(error) ||
          submitSignal.aborted ||
          abortManager.isAborted(submissionRequestId)
        ) {
          return await handleSubmissionAbort(
            error,
            submissionRequestId,
            lifecycleVersion,
            submitCount,
            records,
            selectedTransport.backend,
          );
        }

        return await handleSubmissionError(
          error,
          submissionRequestId,
          lifecycleVersion,
          submitCount,
          records,
          selectedTransport.backend,
        );
      } finally {
        abortManager.clear(submissionRequestId);
        lifecycle.clear(submissionRequestId);
      }
    },
    abort(reason) {
      abortManager.abort(reason);
    },
    reset() {
      abortManager.reset();
    },
  };
};
