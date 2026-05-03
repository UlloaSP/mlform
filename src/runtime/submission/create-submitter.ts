// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import {
  createAbortError,
  isAbortLikeError,
  TransportError,
  transportErrorCodes,
  ValidationError,
} from "../errors";
import { createSubmissionAbortManager } from "./abort";
import { createSubmissionLifecycle } from "./lifecycle";
import {
  buildSubmissionValueRecords,
  cloneSubmissionValueRecords,
  estimatePayloadBytes,
  normalizeTransportResponse,
} from "./request";
import { cloneSubmissionResult, createSubmissionResult } from "./result";
import { commitReportStates, prepareReportStates } from "./reports";
import { createSubmissionErrorFlow } from "./error-flow";
import { createReportUpdates } from "./report-updates";
import { createFieldUpdates } from "./field-updates";
import { toSubmissionProgress, updateStreamProgress } from "./stream-progress";
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
  resetExplanations,
  syncDerivedFieldState,
  shouldResetInactiveFields,
  resolveInactiveFieldPolicy,
  inactiveFieldPolicy,
  onRemoteFieldUpdate,
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
    resetExplanations,
    syncAfterSubmissionTransition,
  });
  const fieldMap = new Map(
    fields.map((field) => [field.id, field as import("./types").LiveSubmissionField]),
  );
  const reportMap = new Map(
    reports.map((report) => [report.id, report as import("./types").LiveSubmissionReport]),
  );

  const { notifySubmitError, handleSubmissionAbort, handleSubmissionError } =
    createSubmissionErrorFlow({
      hooks,
      abortManager,
      lifecycle,
      store,
    });

  const { applyValidatedReportReplace, applyValidatedReportPatch } = createReportUpdates({
    reportMap,
    getReportState: (reportId) => store.getState().reportStates[reportId],
    getReportStates: () => store.getState().reportStates,
    getSubmissionMeta: () => store.getState().submissionProgress?.meta ?? {},
    storePendingPatch: (reportId, patch) => {
      store.update((current) => ({
        ...current,
        submissionProgress: current.submissionProgress
          ? {
              ...current.submissionProgress,
              meta: {
                ...current.submissionProgress.meta,
                pendingReportPatches: {
                  ...(current.submissionProgress.meta.pendingReportPatches as
                    | Record<string, unknown>
                    | undefined),
                  [reportId]: patch,
                },
              },
            }
          : current.submissionProgress,
      }));
    },
  });

  const { applyFieldUpdate } = createFieldUpdates({
    store,
    fieldMap,
    onRemoteFieldUpdate,
  });

  const applyStreamEvent = async (
    event: import("../types").TransportStreamEvent,
    records: import("./request").SubmissionValueRecords,
    backend: string | undefined,
  ): Promise<void> => {
    switch (event.type) {
      case "report-replace":
        await applyValidatedReportReplace(event.reportId, event.payload, records, backend);
        break;
      case "report-patch":
        await applyValidatedReportPatch(
          event.reportId,
          event.patch,
          event.strategy,
          records,
          backend,
        );
        break;
      case "field-update":
        applyFieldUpdate(event);
        break;
      default:
        break;
    }
  };

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

      const records = buildSubmissionValueRecords(fields, resolveInactiveFieldPolicy);
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
          metadata: {
            estimatedPayloadBytes: estimatePayloadBytes({
              values: transportRecords.serializedValues,
              fieldValues: transportRecords.serializedFieldValues,
            }),
          },
          signal: submitSignal,
        };

        let response: unknown;
        if (transport.stream) {
          let streamResultReceived = false;
          const stream = await transport.stream(submitRequest);

          for await (const event of stream) {
            const nextProgress = toSubmissionProgress(store.getState().submissionProgress, event);
            updateStreamProgress(
              store,
              () => abortManager.getCurrentRequestId(),
              nextProgress,
              submissionRequestId,
              lifecycleVersion,
            );
            await applyStreamEvent(event, records, backend);

            if (event.type === "result") {
              response = event.result;
              streamResultReceived = true;
            } else if (event.type === "error") {
              throw event.error;
            }
          }

          if (!streamResultReceived) {
            throw new TransportError("Form submission failed: stream completed without a result.", {
              code: transportErrorCodes.SESSION_RESULT_MISSING,
              retryable: false,
              details: { backend },
            });
          }
        } else {
          response = await transport.submit(submitRequest);
        }

        const stillCurrent =
          abortManager.getCurrentRequestId() === submissionRequestId &&
          store.getState().lifecycleVersion === lifecycleVersion &&
          !submitSignal.aborted &&
          !abortManager.isAborted(submissionRequestId);
        if (!stillCurrent) {
          throw createAbortError(abortManager.getAbortReason(submissionRequestId));
        }

        const normalizedResponse = normalizeTransportResponse(response);
        const baseResult: Omit<import("../types").SubmitResult, "reportStates"> = {
          backend,
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
