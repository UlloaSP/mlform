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
import { deepFreeze } from "../utils";
import { cloneValue } from "../values";

const awaitWithAbort = async <T>(promise: PromiseLike<T>, signal: AbortSignal): Promise<T> => {
  if (signal.aborted) throw createAbortError(String(signal.reason ?? ""));

  return new Promise<T>((resolve, reject) => {
    const onAbort = () => reject(createAbortError(String(signal.reason ?? "")));
    signal.addEventListener("abort", onAbort, { once: true });
    void Promise.resolve(promise)
      .then(resolve, reject)
      .finally(() => {
        signal.removeEventListener("abort", onAbort);
      });
  });
};

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
  onListenerError,
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
      onListenerError,
    });

  return {
    async submit(options) {
      abortManager.ensureIdle();
      const submissionRequestId = abortManager.begin();
      const lifecycleVersion = store.getState().lifecycleVersion;
      const backend = options?.backend;
      abortManager.setActiveController(
        submissionRequestId,
        typeof AbortController !== "undefined" ? new AbortController() : null,
      );
      abortManager.attachExternalSignal(options, submissionRequestId);
      const submitSignal = abortManager.createSignal(options);
      const isCurrentSubmission = () =>
        abortManager.getCurrentRequestId() === submissionRequestId &&
        store.getState().lifecycleVersion === lifecycleVersion &&
        !submitSignal.aborted &&
        !abortManager.isAborted(submissionRequestId);

      let validation: import("../types").FormValidationResult;
      try {
        validation = await validate(submitSignal);
      } catch (error) {
        abortManager.clear(submissionRequestId);
        throw error;
      }

      if (abortManager.getCurrentRequestId() !== submissionRequestId) {
        abortManager.clear(submissionRequestId);
        throw createAbortError(abortManager.getAbortReason(submissionRequestId) || "superseded");
      }
      if (store.getState().lifecycleVersion !== lifecycleVersion) {
        abortManager.clear(submissionRequestId);
        throw createAbortError("form state changed during submission validation");
      }
      if (!validation.valid) {
        abortManager.clear(submissionRequestId);
        throw new ValidationError(validation);
      }
      if (options?.signal?.aborted) {
        abortManager.clear(submissionRequestId);
        throw createAbortError(String(options.signal.reason ?? ""));
      }

      store.batch(() => {
        markReportsLoading();
        lifecycle.start(submissionRequestId);
      });

      const submitCount = getSubmitCount();
      let records = { inputs: [], displayValues: {}, modelValues: {} } as ReturnType<
        typeof buildSubmissionValueRecords
      >;

      try {
        records = buildSubmissionValueRecords(fields, backend, resolveInactiveFieldPolicy);
        if (beforeSubmitRecords) {
          await awaitWithAbort(beforeSubmitRecords(records, submitSignal), submitSignal);
        }
        const beforeHookRecords = cloneSubmissionValueRecords(records);
        if (hooks?.beforeSubmit) {
          await awaitWithAbort(
            Promise.resolve(
              hooks.beforeSubmit({
                backend,
                ...beforeHookRecords,
                submitCount,
                signal: submitSignal,
              }),
            ),
            submitSignal,
          );
        }

        if (submitSignal.aborted || abortManager.isAborted(submissionRequestId)) {
          throw createAbortError(abortManager.getAbortReason(submissionRequestId));
        }

        const transportRecords = cloneSubmissionValueRecords(records);
        const submitRequest = {
          backend,
          ...transportRecords,
          fields: deepFreeze(cloneValue(normalizedSchema.fields)),
          reports: deepFreeze(cloneValue(normalizedSchema.reports)),
          signal: submitSignal,
        };

        const response = await awaitWithAbort(transport.submit(submitRequest), submitSignal);

        if (!isCurrentSubmission()) {
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
        const nextReportStates = await awaitWithAbort(
          prepareReportStates(
            reports,
            {
              ...baseResult,
              reportContexts,
              reportStates: {},
            },
            submitSignal,
          ),
          submitSignal,
        );
        if (!isCurrentSubmission()) {
          throw createAbortError(abortManager.getAbortReason(submissionRequestId));
        }
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
          if (hooks?.afterSubmit) {
            await awaitWithAbort(
              Promise.resolve(
                hooks.afterSubmit({
                  backend,
                  ...afterHookRecords,
                  submitCount,
                  result: cloneSubmissionResult(reports, result),
                }),
              ),
              submitSignal,
            );
          }
        } catch (error) {
          if (
            isAbortLikeError(error) ||
            submitSignal.aborted ||
            abortManager.isAborted(submissionRequestId)
          ) {
            throw error;
          }
          if (hookFailurePolicy?.afterSubmit !== "preserve-success") {
            throw error;
          }
          await notifySubmitError(backend, records, submitCount, error);
        }

        if (!isCurrentSubmission()) {
          throw createAbortError(
            abortManager.getAbortReason(submissionRequestId) ||
              "form state changed during submission completion",
          );
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
    isActive() {
      return abortManager.getCurrentRequestId() !== null;
    },
    abort(reason) {
      abortManager.abort(reason);
    },
    reset() {
      abortManager.reset();
    },
  };
};
