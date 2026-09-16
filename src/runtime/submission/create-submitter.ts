// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { createAbortError, isAbortLikeError, ValidationError } from "../errors";
import { createReportContexts } from "@/schema";
import { createSubmissionAbortManager } from "./abort";
import { createSubmissionLifecycle } from "./lifecycle";
import { buildSubmissionValueRecords, cloneSubmissionValueRecords } from "./request";
import { normalizeTransportResponse } from "./transport-response";
import { cloneSubmissionResult, createSubmissionResult } from "./result";
import { commitReportStates, prepareReportStates } from "./reports";
import { createSubmissionErrorFlow } from "./error-flow";
import type { CreateFormSubmitterOptions, FormSubmitter } from "./types";

export const createFormSubmitter = ({
  store,
  transport,
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
  beforeSubmitRecords,
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
  const { notifySubmitError, handleSubmissionAbort, handleSubmissionError } =
    createSubmissionErrorFlow({
      hooks,
      abortManager,
      lifecycle,
      store,
    });

  return {
    async submit(options) {
      abortManager.ensureIdle();
      const submissionRequestId = abortManager.begin();
      const backend = options?.backend;

      let validation: import("../types").FormValidationResult;
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

      const records = buildSubmissionValueRecords(fields, backend, resolveInactiveFieldPolicy);
      await beforeSubmitRecords?.(records);
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
        const beforeHookRecords = cloneSubmissionValueRecords(records);
        await hooks?.beforeSubmit?.({
          backend,
          ...beforeHookRecords,
          submitCount,
          signal: submitSignal,
        });

        if (submitSignal.aborted || abortManager.isAborted(submissionRequestId)) {
          throw createAbortError(abortManager.getAbortReason(submissionRequestId));
        }

        const transportRecords = cloneSubmissionValueRecords(records);
        const submitRequest = {
          backend,
          ...transportRecords,
          fields: normalizedSchema.fields,
          reports: normalizedSchema.reports,
          signal: submitSignal,
        };

        const response = await transport.submit(submitRequest);

        const stillCurrent =
          abortManager.getCurrentRequestId() === submissionRequestId &&
          store.getState().lifecycleVersion === lifecycleVersion &&
          !submitSignal.aborted &&
          !abortManager.isAborted(submissionRequestId);
        if (!stillCurrent) {
          throw createAbortError(abortManager.getAbortReason(submissionRequestId));
        }

        const normalizedResponse = normalizeTransportResponse(response);
        const baseResult: Omit<import("../types").SubmitResult, "reportContexts" | "reportStates"> =
          {
            backend,
            ...records,
            reports: normalizedResponse.reports ?? [],
            meta: normalizedResponse.meta ?? {},
            raw: normalizedResponse.raw,
          };
        const reportContexts = createReportContexts(normalizedSchema.reports, baseResult);
        const nextReportStates = await prepareReportStates(reports, {
          ...baseResult,
          reportContexts,
          reportStates: {},
        });
        const result = createSubmissionResult(
          reports,
          { ...baseResult, reportContexts },
          nextReportStates,
        );

        const storedResult = cloneSubmissionResult(reports, result);
        store.batch(() => {
          commitReportStates(reports, nextReportStates);
          lifecycle.succeed(storedResult);
        });

        try {
          const afterHookRecords = cloneSubmissionValueRecords(records);
          await hooks?.afterSubmit?.({
            backend,
            ...afterHookRecords,
            submitCount,
            result: cloneSubmissionResult(reports, result),
          });
        } catch (error) {
          if (hookFailurePolicy?.afterSubmit !== "preserve-success") {
            throw error;
          }
          await notifySubmitError(backend, records, submitCount, error);
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
            backend,
          );
        }

        return await handleSubmissionError(
          error,
          submissionRequestId,
          lifecycleVersion,
          submitCount,
          records,
          backend,
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
