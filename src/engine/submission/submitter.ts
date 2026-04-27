// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import {
  createAbortError,
  isAbortLikeError,
  TransportError,
  transportErrorCodes,
  SubmissionAbortedError,
  SubmitError,
  ValidationError,
} from "../errors";
import type { NormalizedFormSchema } from "../schema";
import type { EngineStore, InternalFieldState } from "../state";
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
import { toSnapshotState } from "../validation";
import { cloneValue } from "../values";
import { createSubmissionAbortManager } from "./abort";
import { createSubmissionLifecycle } from "./lifecycle";
import {
  buildSubmissionValueRecords,
  cloneSubmissionValueRecords,
  estimatePayloadBytes,
  normalizeTransportResponse,
  type SubmissionValueRecords,
} from "./request";
import { cloneSubmissionResult, createSubmissionResult } from "./result";
import { commitReportStates, prepareReportStates, type SubmissionReport } from "./reports";

type SubmissionField = Parameters<typeof buildSubmissionValueRecords>[0][number];
type LiveSubmissionField = SubmissionField & {
  coerceValue(value: unknown): unknown;
  commitState(state: InternalFieldState): void;
};
type LiveSubmissionReport = SubmissionReport;

type SyncDerivedFieldStateOptions = {
  values?: Record<string, unknown>;
  preserveValidationErrors?: boolean;
  preserveExternalErrors?: boolean;
  resetInactiveToInitial?: boolean;
  inactiveFieldPolicy?: InactiveFieldPolicy;
};

type CreateFormSubmitterOptions = {
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
  resetExplanations: () => void;
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
  const fieldMap = new Map<string, LiveSubmissionField>(
    fields.map((field) => [field.id, field as LiveSubmissionField]),
  );
  const reportMap = new Map<string, LiveSubmissionReport>(
    reports.map((report) => [report.id, report as LiveSubmissionReport]),
  );

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

  const updateStreamProgress = (
    progress: SubmissionProgressState,
    submissionRequestId: number,
    lifecycleVersion: number,
  ): void => {
    if (
      abortManager.getCurrentRequestId() !== submissionRequestId ||
      store.getState().lifecycleVersion !== lifecycleVersion
    ) {
      return;
    }

    store.update((current) => ({
      ...current,
      submissionProgress: progress,
    }));
  };

  const toSubmissionProgress = (
    previous: SubmissionProgressState | null,
    event: TransportStreamEvent,
  ): SubmissionProgressState => {
    const base: SubmissionProgressState = previous ?? {
      meta: {},
      chunkCount: 0,
    };

    switch (event.type) {
      case "progress":
        return {
          ...base,
          loaded: event.loaded ?? base.loaded,
          total: event.total ?? base.total,
          message: event.message ?? base.message,
          meta: {
            ...base.meta,
            ...event.meta,
          },
          lastEventType: event.type,
        };
      case "meta":
        return {
          ...base,
          sessionState:
            event.meta.sessionClosed === true
              ? "closed"
              : event.meta.sessionOpening === true
                ? "opening"
                : event.meta.sessionOpen === true
                  ? "open"
                  : event.meta.sessionClosing === true
                    ? "closing"
                    : base.sessionState,
          bufferedMessages:
            typeof event.meta.bufferedMessages === "number"
              ? event.meta.bufferedMessages
              : base.bufferedMessages,
          meta: {
            ...base.meta,
            ...event.meta,
          },
          lastEventType: event.type,
        };
      case "chunk":
        return {
          ...base,
          chunkCount: base.chunkCount + 1,
          sessionState: event.meta?.session === true ? "open" : base.sessionState,
          bufferedMessages:
            typeof event.meta?.bufferedMessages === "number"
              ? event.meta.bufferedMessages
              : base.bufferedMessages,
          sessionMessageCount:
            event.meta?.session === true
              ? (base.sessionMessageCount ?? 0) + 1
              : base.sessionMessageCount,
          lastSessionMessageType:
            event.meta?.session === true && typeof event.meta?.messageType === "string"
              ? event.meta.messageType
              : base.lastSessionMessageType,
          meta: {
            ...base.meta,
            ...event.meta,
          },
          lastEventType: event.type,
        };
      case "report-replace":
      case "report-patch":
      case "field-update":
        return {
          ...base,
          meta: {
            ...base.meta,
            ...event.meta,
          },
          lastEventType: event.type,
        };
      case "result":
        return {
          ...base,
          meta: {
            ...base.meta,
            ...event.meta,
          },
          lastEventType: event.type,
        };
      case "error":
        return {
          ...base,
          meta: {
            ...base.meta,
            ...event.meta,
          },
          lastEventType: event.type,
        };
    }
  };

  const applyPatchValue = (
    current: unknown,
    patch: unknown,
    strategy: "replace" | "shallow-merge" | "deep-merge" = "deep-merge",
  ): unknown => {
    if (strategy === "replace") {
      return cloneValue(patch);
    }

    const isRecord = (value: unknown): value is Record<string, unknown> =>
      typeof value === "object" && value !== null && !Array.isArray(value);

    if (strategy === "shallow-merge") {
      if (!isRecord(current) || !isRecord(patch)) {
        return cloneValue(patch);
      }
      return {
        ...cloneValue(current),
        ...cloneValue(patch),
      };
    }

    if (!isRecord(current) || !isRecord(patch)) {
      return cloneValue(patch);
    }

    const merged: Record<string, unknown> = { ...cloneValue(current) };
    for (const [key, value] of Object.entries(patch)) {
      merged[key] =
        key in merged ? applyPatchValue(merged[key], value, "deep-merge") : cloneValue(value);
    }
    return merged;
  };

  const applyReportReplace = (reportId: string, payload: unknown): void => {
    const report = reportMap.get(reportId);
    if (!report) {
      return;
    }

    report.commitState({
      payload: cloneValue(payload),
      error: null,
      status: payload === undefined ? "idle" : "ready",
    });
  };

  const createLivePartialResult = (
    records: SubmissionValueRecords,
    backend: string | undefined,
    reportId: string,
    payload: unknown,
  ): SubmitResult => {
    const report = reportMap.get(reportId);
    const source = report?.config?.source ?? reportId;
    const currentReportStates = cloneValue(store.getState().reportStates);

    return {
      backend,
      values: cloneValue(records.values),
      fieldValues: cloneValue(records.fieldValues),
      serializedValues: cloneValue(records.serializedValues),
      serializedFieldValues: cloneValue(records.serializedFieldValues),
      reports: {
        [source]: cloneValue(payload),
      },
      reportStates: currentReportStates,
      meta: cloneValue(store.getState().submissionProgress?.meta ?? {}),
      raw: cloneValue(payload),
    };
  };

  const applyValidatedReportReplace = async (
    reportId: string,
    payload: unknown,
    records: SubmissionValueRecords,
    backend: string | undefined,
  ): Promise<void> => {
    const report = reportMap.get(reportId);
    if (!report) {
      return;
    }

    if (report.partialUpdatePolicy === "trust") {
      applyReportReplace(reportId, payload);
      return;
    }

    if (report.partialUpdatePolicy === "defer") {
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
                  [reportId]: {
                    type: "replace",
                    payload: cloneValue(payload),
                  },
                },
              },
            }
          : current.submissionProgress,
      }));
      return;
    }

    try {
      const nextState = await report.prepareState(
        createLivePartialResult(records, backend, reportId, payload),
      );
      report.commitState(nextState);
    } catch {
      applyReportReplace(reportId, payload);
    }
  };

  const applyReportPatch = (
    reportId: string,
    patch: unknown,
    strategy: "replace" | "shallow-merge" | "deep-merge" = "deep-merge",
  ): void => {
    const report = reportMap.get(reportId);
    if (!report) {
      return;
    }

    const current = store.getState().reportStates[reportId];
    const nextPayload = applyPatchValue(current?.payload, patch, strategy);
    report.commitState({
      payload: nextPayload,
      error: null,
      status: nextPayload === undefined ? "idle" : "ready",
    });
  };

  const applyValidatedReportPatch = async (
    reportId: string,
    patch: unknown,
    strategy: "replace" | "shallow-merge" | "deep-merge" = "deep-merge",
    records: SubmissionValueRecords,
    backend: string | undefined,
  ): Promise<void> => {
    const report = reportMap.get(reportId);
    if (!report) {
      return;
    }

    if (report.partialUpdatePolicy === "trust") {
      applyReportPatch(reportId, patch, strategy);
      return;
    }

    if (report.partialUpdatePolicy === "defer") {
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
                  [reportId]: {
                    type: "patch",
                    patch: cloneValue(patch),
                    strategy,
                  },
                },
              },
            }
          : current.submissionProgress,
      }));
      return;
    }

    const current = store.getState().reportStates[reportId];
    const nextPayload = applyPatchValue(current?.payload, patch, strategy);

    try {
      const nextState = await report.prepareState(
        createLivePartialResult(records, backend, reportId, nextPayload),
      );
      report.commitState(nextState);
    } catch {
      applyReportPatch(reportId, patch, strategy);
    }
  };

  const applyFieldUpdate = (
    event: Extract<TransportStreamEvent, { type: "field-update" }>,
  ): void => {
    const field = fieldMap.get(event.fieldId);
    if (!field) {
      return;
    }

    const current = store.getState().fieldStates[event.fieldId];
    if (!current) {
      return;
    }

    const nextValue = event.value !== undefined ? field.coerceValue(event.value) : current.value;
    field.commitState(
      toSnapshotState({
        ...current,
        value: nextValue,
        touched: event.touched ?? current.touched,
        dirty: event.dirty ?? current.dirty,
        externalErrors: event.errors ? [...event.errors] : current.externalErrors,
      }),
    );
  };

  const applyStreamEvent = async (
    event: TransportStreamEvent,
    records: SubmissionValueRecords,
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
          backend: backend,
          ...beforeSubmitRecords,
          submitCount,
          signal: submitSignal,
        });

        if (submitSignal.aborted || abortManager.isAborted(submissionRequestId)) {
          throw createAbortError(abortManager.getAbortReason(submissionRequestId));
        }

        const transportRecords = cloneSubmissionValueRecords(records);
        const submitRequest = {
          backend: backend,
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
            updateStreamProgress(nextProgress, submissionRequestId, lifecycleVersion);
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
              details: {
                backend,
              },
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
        const baseResult: Omit<SubmitResult, "reportStates"> = {
          backend: backend,
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
            backend: backend,
            ...afterSubmitRecords,
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
