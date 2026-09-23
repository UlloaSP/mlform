// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { createAbortError, isAbortLikeError, ValidationError } from "../errors";
import { createReportContexts } from "@/schema";
import { transitionEngineState } from "../state";
import { awaitWithSubmissionAbort, createSubmissionAbortManager } from "./abort";
import { assertBackendIdentity } from "./backend";
import { createSubmissionLifecycle } from "./lifecycle";
import { buildSubmissionValueRecords, cloneSubmissionValueRecords } from "./request";
import { normalizeTransportResponse } from "./transport-response";
import { cloneSubmissionResult, createSubmissionResult } from "./result";
import { commitReportStates, prepareReportStates } from "./reports";
import { createSubmissionErrorFlow } from "./error-flow";
import { createTransportRequest } from "./transport-request";
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
      const backend = options?.backend;
      assertBackendIdentity(backend);
      const submissionRequestId = abortManager.begin();
      const lifecycleVersion = store.getState().lifecycleVersion;
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

      const abortBeforeSubmission = (): never => {
        const abortedError = createAbortError(abortManager.getAbortReason(submissionRequestId));
        try {
          if (
            abortManager.getCurrentRequestId() === submissionRequestId &&
            store.getState().lifecycleVersion === lifecycleVersion &&
            store.getState().lifecycle === "active"
          ) {
            store.batch(() => {
              store.update((current) => transitionEngineState(current, { type: "bump-lifecycle" }));
              lifecycle.abort(abortedError.message);
            });
          }
        } finally {
          abortManager.clear(submissionRequestId);
        }
        throw abortedError;
      };

      let validation: import("../types").FormValidationResult;
      try {
        validation = await awaitWithSubmissionAbort(validate(submitSignal), submitSignal);
      } catch (error) {
        if (
          isAbortLikeError(error) ||
          submitSignal.aborted ||
          abortManager.isAborted(submissionRequestId)
        ) {
          abortBeforeSubmission();
        }
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
      if (submitSignal.aborted || abortManager.isAborted(submissionRequestId)) {
        abortBeforeSubmission();
      }
      if (!validation.valid) {
        abortManager.clear(submissionRequestId);
        throw new ValidationError(validation);
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
          await awaitWithSubmissionAbort(beforeSubmitRecords(records, submitSignal), submitSignal);
        }
        const beforeHookRecords = cloneSubmissionValueRecords(records);
        if (hooks?.beforeSubmit) {
          await awaitWithSubmissionAbort(
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

        const submitRequest = createTransportRequest({
          backend,
          records,
          schema: normalizedSchema,
          signal: submitSignal,
        });

        const response = await awaitWithSubmissionAbort(
          transport.submit(submitRequest),
          submitSignal,
        );

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
        const nextReportStates = await awaitWithSubmissionAbort(
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
            await awaitWithSubmissionAbort(
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
