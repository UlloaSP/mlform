// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { EngineError, SubmissionAbortedError, SubmitError, ValidationError } from "./errors";
import { createFieldController } from "./field-controller";
import {
  createInitialEngineState,
  toFieldStateSnapshots,
  toFormState,
  type EngineStore,
  type InternalFieldState,
} from "./internal";
import { createReportController } from "./report-controller";
import { normalizeSchema } from "./schema";
import { createStore } from "./store";
import type {
  CreateFormConfig,
  FieldController,
  FieldValidationResult,
  FormController,
  FormValidationContext,
  FormValidationIssue,
  FormValidationResult,
  ReportStateSnapshot,
  ReportController,
  SelectorSubscriptionOptions,
  SubmitOptions,
  SubmitResult,
  TransportResponse,
} from "./types";
import { isRecord, shallowEquality } from "./utils";

type InternalFieldController = FieldController & {
  serialize(): unknown;
  refresh(options?: {
    values?: Record<string, unknown>;
    preserveValidationErrors?: boolean;
    preserveExternalErrors?: boolean;
  }): void;
  applyValue(value: unknown, values: Record<string, unknown>): void;
  prepareValue(value: unknown, values: Record<string, unknown>): InternalFieldState;
  commitState(state: InternalFieldState): void;
  setExternalErrors(errors: string[]): void;
  coerceValue(value: unknown): unknown;
  validate(validationVersion?: number): Promise<FieldValidationResult>;
};

type InternalReportController = ReportController & {
  prepareState(result: SubmitResult): ReportStateSnapshot;
  commitState(state: ReportStateSnapshot): void;
  update(result: SubmitResult): void;
  reset(): void;
};

const normalizeTransportResponse = (response: unknown): TransportResponse => {
  if (!isRecord(response)) {
    return { raw: response };
  }

  const reports = isRecord(response.reports) ? response.reports : undefined;
  const meta = isRecord(response.meta) ? response.meta : undefined;
  const raw = "raw" in response ? response.raw : response;

  return {
    reports,
    meta,
    raw,
  };
};

const createValidationResult = (store: EngineStore): FormValidationResult => {
  const state = toFormState(store.getState());
  return {
    valid: state.valid,
    fields: state.errors.fields,
    formErrors: state.errors.form,
  };
};

const mergeValidationIssue = (
  fieldErrors: Record<string, string[]>,
  formErrors: string[],
  issue: FormValidationIssue | string[] | void,
): void => {
  if (!issue) {
    return;
  }

  if (Array.isArray(issue)) {
    formErrors.push(...issue);
    return;
  }

  if (issue.form) {
    formErrors.push(...issue.form);
  }

  if (issue.fields) {
    for (const [fieldId, errors] of Object.entries(issue.fields)) {
      fieldErrors[fieldId] = [...(fieldErrors[fieldId] ?? []), ...errors];
    }
  }
};

const createAbortError = (reason?: string): SubmissionAbortedError => {
  return new SubmissionAbortedError(reason ? `Form submission was aborted: ${reason}` : undefined);
};

const isAbortLikeError = (error: unknown): boolean => {
  return (
    error instanceof SubmissionAbortedError ||
    (error instanceof Error && error.name === "AbortError")
  );
};

export const createForm = (config: CreateFormConfig): FormController => {
  const normalizedSchema = normalizeSchema(config.schema, config.registry);
  const store = createStore(createInitialEngineState());

  const getValues = () => toFormState(store.getState()).values;
  const getSubmitCount = () => store.getState().submitCount;
  const getFormStatus = () => store.getState().status;

  let activeAbortController: AbortController | null = null;
  let activeAbortReason = "";
  let currentSubmissionRequestId: number | null = null;
  let submissionRequestSequence = 0;
  let validationSequence = 0;
  const abortedSubmissionReasons = new Map<number, string>();

  const fields = normalizedSchema.fields.map((fieldConfig) => {
    const definition = config.registry.getField(fieldConfig.kind);
    if (!definition) {
      throw new EngineError(
        `Field definition "${fieldConfig.kind}" disappeared during form creation.`,
      );
    }

    return createFieldController({
      config: {
        ...fieldConfig,
        defaultValue:
          config.initialValues?.[fieldConfig.id] !== undefined
            ? config.initialValues[fieldConfig.id]
            : fieldConfig.defaultValue,
      },
      definition,
      store,
      getValues,
      getSubmitCount,
      getFormStatus,
      onValueChange: (_fieldId, nextValues) => {
        store.update((current) => ({
          ...current,
          status: "editing",
          formErrors: [],
          lifecycleVersion: current.lifecycleVersion + 1,
        }));

        syncDerivedFieldState({
          values: nextValues,
          preserveValidationErrors: false,
          preserveExternalErrors: false,
        });
      },
    });
  });

  const reports = normalizedSchema.reports.map((reportConfig) => {
    const definition = config.registry.getReport(reportConfig.kind);
    if (!definition) {
      throw new EngineError(
        `Report definition "${reportConfig.kind}" disappeared during form creation.`,
      );
    }

    return createReportController({
      config: reportConfig,
      definition,
      store,
    });
  });

  const fieldMap = new Map<string, InternalFieldController>(
    fields.map((field) => [field.id, field as InternalFieldController]),
  );
  const reportMap = new Map<string, InternalReportController>(
    reports.map((report) => [report.id, report as InternalReportController]),
  );

  const bumpLifecycleVersion = (): number => {
    store.update((current) => ({
      ...current,
      lifecycleVersion: current.lifecycleVersion + 1,
    }));

    return store.getState().lifecycleVersion;
  };

  const syncDerivedFieldState = (options?: {
    values?: Record<string, unknown>;
    preserveValidationErrors?: boolean;
    preserveExternalErrors?: boolean;
  }): void => {
    for (const field of fields) {
      (field as InternalFieldController).refresh(options);
    }
  };

  const setRestingStatus = (): void => {
    const snapshot = toFormState(store.getState());
    store.update((current) => ({
      ...current,
      status: snapshot.dirty || snapshot.touched ? "editing" : "idle",
    }));

    syncDerivedFieldState({
      preserveValidationErrors: true,
      preserveExternalErrors: true,
    });
  };

  const validateFormRules = async (
    validationVersion: number,
    lifecycleVersion: number,
  ): Promise<FormValidationResult> => {
    const formErrors: string[] = [];
    const fieldErrors: Record<string, string[]> = Object.fromEntries(
      fields.map((field) => [field.id, []]),
    ) as Record<string, string[]>;

    if (config.validators?.length) {
      const context: FormValidationContext = {
        values: getValues(),
        submitCount: getSubmitCount(),
        formStatus: getFormStatus(),
        fields: toFieldStateSnapshots(store.getState().fieldStates),
        schema: {
          fields: normalizedSchema.fields,
          reports: normalizedSchema.reports,
        },
      };

      for (const validator of config.validators) {
        const issue = await validator(context);
        mergeValidationIssue(fieldErrors, formErrors, issue);

        if (
          store.getState().activeValidationVersion !== validationVersion ||
          store.getState().lifecycleVersion !== lifecycleVersion
        ) {
          return createValidationResult(store);
        }
      }
    }

    const unknownValidatorFieldIds = Object.keys(fieldErrors).filter(
      (fieldId) => !fieldMap.has(fieldId),
    );
    if (unknownValidatorFieldIds.length > 0) {
      throw new EngineError(
        `Form validator returned errors for unknown fields: ${unknownValidatorFieldIds.join(", ")}.`,
      );
    }

    if (
      store.getState().activeValidationVersion !== validationVersion ||
      store.getState().lifecycleVersion !== lifecycleVersion
    ) {
      return createValidationResult(store);
    }

    for (const field of fields) {
      field.setExternalErrors(fieldErrors[field.id] ?? []);
    }

    store.update((current) => ({
      ...current,
      formErrors,
    }));

    return createValidationResult(store);
  };

  const buildSerializedValues = (): Record<string, unknown> => {
    const policy = config.inactiveFieldPolicy ?? "omit";
    const entries: Array<[string, unknown]> = [];

    for (const field of fields) {
      const state = field.state;
      const isInactive = !state.visible || state.disabled;

      if (policy === "omit" && isInactive) {
        continue;
      }

      entries.push([field.id, field.serialize()]);
    }

    return Object.fromEntries(entries);
  };

  const buildSubmissionValues = (): Record<string, unknown> => {
    const policy = config.inactiveFieldPolicy ?? "omit";
    const entries: Array<[string, unknown]> = [];

    for (const field of fields) {
      const state = field.state;
      const isInactive = !state.visible || state.disabled;

      if (policy === "omit" && isInactive) {
        continue;
      }

      entries.push([field.id, state.value]);
    }

    return Object.fromEntries(entries);
  };

  const controller: FormController = {
    get fields() {
      return fields;
    },
    get reports() {
      return reports;
    },
    get state() {
      return toFormState(store.getState());
    },
    getField(id) {
      return fieldMap.get(id);
    },
    getReport(id) {
      return reportMap.get(id);
    },
    getValues() {
      return getValues();
    },
    setValues(values) {
      const updates = Object.entries(values);
      const finalValues = {
        ...getValues(),
      };
      const preparedFieldStates = new Map<string, InternalFieldState>();

      for (const [fieldId, value] of updates) {
        const field = fieldMap.get(fieldId);
        if (!field) {
          throw new EngineError(`Unknown field "${fieldId}".`);
        }

        finalValues[fieldId] = field.coerceValue(value);
      }

      for (const [fieldId, value] of updates) {
        const field = fieldMap.get(fieldId);
        if (!field) {
          throw new EngineError(`Unknown field "${fieldId}".`);
        }

        preparedFieldStates.set(fieldId, field.prepareValue(value, finalValues));
      }

      bumpLifecycleVersion();

      for (const [fieldId, nextState] of preparedFieldStates) {
        const field = fieldMap.get(fieldId);
        if (!field) {
          throw new EngineError(`Unknown field "${fieldId}".`);
        }

        field.commitState(nextState);
      }

      store.update((current) => ({
        ...current,
        status: "editing",
        formErrors: [],
      }));

      syncDerivedFieldState({
        values: finalValues,
        preserveValidationErrors: false,
        preserveExternalErrors: false,
      });
    },
    async validate() {
      const lifecycleVersion = store.getState().lifecycleVersion;
      const validationVersion = ++validationSequence;

      store.update((current) => ({
        ...current,
        status: "validating",
        formErrors: [],
        activeValidationVersion: validationVersion,
      }));

      try {
        await config.hooks?.beforeValidate?.({
          values: this.getValues(),
          submitCount: getSubmitCount(),
        });

        await Promise.all(
          fields.map((field) => (field as InternalFieldController).validate(validationVersion)),
        );

        if (store.getState().lifecycleVersion !== lifecycleVersion) {
          return createValidationResult(store);
        }

        syncDerivedFieldState({
          preserveValidationErrors: true,
          preserveExternalErrors: false,
        });

        const result = await validateFormRules(validationVersion, lifecycleVersion);

        if (store.getState().activeValidationVersion === validationVersion) {
          setRestingStatus();
        }

        await config.hooks?.afterValidate?.({
          values: this.getValues(),
          result,
          submitCount: getSubmitCount(),
        });

        return result;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);

        if (
          store.getState().activeValidationVersion === validationVersion &&
          store.getState().lifecycleVersion === lifecycleVersion
        ) {
          store.update((current) => ({
            ...current,
            status: "error",
            formErrors: [message],
          }));

          syncDerivedFieldState({
            preserveValidationErrors: true,
            preserveExternalErrors: true,
          });
        }

        throw error;
      }
    },
    async submit(options?: SubmitOptions) {
      if (currentSubmissionRequestId !== null) {
        throw new EngineError("Form submission is already in progress.");
      }

      const submissionRequestId = ++submissionRequestSequence;
      currentSubmissionRequestId = submissionRequestId;

      let validation: FormValidationResult;
      try {
        validation = await this.validate();
      } catch (error) {
        if (currentSubmissionRequestId === submissionRequestId) {
          currentSubmissionRequestId = null;
        }
        abortedSubmissionReasons.delete(submissionRequestId);
        throw error;
      }

      if (currentSubmissionRequestId !== submissionRequestId) {
        abortedSubmissionReasons.delete(submissionRequestId);
        throw createAbortError(activeAbortReason || "superseded");
      }
      if (!validation.valid) {
        currentSubmissionRequestId = null;
        throw new ValidationError(validation);
      }

      const values = buildSubmissionValues();
      const serializedValues = buildSerializedValues();

      for (const report of reports) {
        report.reset();
      }

      activeAbortController = typeof AbortController !== "undefined" ? new AbortController() : null;
      activeAbortReason = abortedSubmissionReasons.get(submissionRequestId) ?? "";

      if (activeAbortReason && activeAbortController) {
        activeAbortController.abort(activeAbortReason);
      }

      if (options?.signal) {
        if (options.signal.aborted) {
          currentSubmissionRequestId = null;
          abortedSubmissionReasons.delete(submissionRequestId);
          throw createAbortError(String(options.signal.reason ?? ""));
        }

        options.signal.addEventListener(
          "abort",
          () => {
            activeAbortReason =
              options.signal?.reason instanceof Error
                ? options.signal.reason.message
                : String(options.signal?.reason ?? "");
            activeAbortController?.abort(options.signal?.reason);
          },
          { once: true },
        );
      }

      store.update((current) => ({
        ...current,
        status: "submitting",
        submitCount: current.submitCount + 1,
        formErrors: [],
        lastResult: null,
        activeSubmissionVersion: submissionRequestId,
      }));

      syncDerivedFieldState({
        preserveValidationErrors: true,
        preserveExternalErrors: true,
      });

      const submitCount = getSubmitCount();
      const lifecycleVersion = store.getState().lifecycleVersion;
      const submitSignal =
        activeAbortController?.signal ?? options?.signal ?? new AbortController().signal;

      try {
        await config.hooks?.beforeSubmit?.({
          values,
          serializedValues,
          submitCount,
          signal: submitSignal,
        });

        if (submitSignal.aborted || abortedSubmissionReasons.has(submissionRequestId)) {
          throw createAbortError(activeAbortReason);
        }

        const response = await config.transport.submit({
          values,
          serializedValues,
          fields: normalizedSchema.fields,
          reports: normalizedSchema.reports,
          signal: submitSignal,
        });

        const stillCurrent =
          currentSubmissionRequestId === submissionRequestId &&
          store.getState().lifecycleVersion === lifecycleVersion &&
          !submitSignal.aborted &&
          !abortedSubmissionReasons.has(submissionRequestId);

        if (!stillCurrent) {
          throw createAbortError(activeAbortReason);
        }

        const normalizedResponse = normalizeTransportResponse(response);
        const baseResult: SubmitResult = {
          values,
          serializedValues,
          reports: normalizedResponse.reports ?? {},
          reportStates: {},
          meta: normalizedResponse.meta ?? {},
          raw: normalizedResponse.raw,
        };
        const nextReportStates = new Map<string, ReportStateSnapshot>();

        for (const report of reports) {
          nextReportStates.set(report.id, report.prepareState(baseResult));
        }

        const reportStates = Object.fromEntries(nextReportStates) as Record<
          string,
          ReportStateSnapshot
        >;
        const result: SubmitResult = {
          ...baseResult,
          reportStates,
        };

        store.update((current) => ({
          ...current,
          lastResult: result,
        }));

        for (const report of reports) {
          const nextState = nextReportStates.get(report.id);
          if (!nextState) {
            throw new EngineError(`Prepared report state missing for "${report.id}".`);
          }
          report.commitState(nextState);
        }

        store.update((current) => ({
          ...current,
          status: "success",
          formErrors: [],
        }));

        syncDerivedFieldState({
          preserveValidationErrors: true,
          preserveExternalErrors: true,
        });

        await config.hooks?.afterSubmit?.({
          values,
          serializedValues,
          submitCount,
          result,
        });

        return result;
      } catch (error) {
        if (
          isAbortLikeError(error) ||
          submitSignal.aborted ||
          abortedSubmissionReasons.has(submissionRequestId)
        ) {
          const abortedError =
            error instanceof SubmissionAbortedError
              ? error
              : createAbortError(
                  activeAbortReason || abortedSubmissionReasons.get(submissionRequestId) || "",
                );

          if (
            currentSubmissionRequestId === submissionRequestId &&
            store.getState().lifecycleVersion === lifecycleVersion
          ) {
            store.update((current) => ({
              ...current,
              status: "idle",
              formErrors: [abortedError.message],
              lastResult: null,
            }));

            syncDerivedFieldState({
              preserveValidationErrors: true,
              preserveExternalErrors: true,
            });
          }

          await config.hooks?.onSubmitError?.({
            values,
            serializedValues,
            submitCount,
            error: abortedError,
          });

          throw abortedError;
        }

        const message = error instanceof Error ? error.message : String(error);

        if (
          currentSubmissionRequestId === submissionRequestId &&
          store.getState().lifecycleVersion === lifecycleVersion
        ) {
          store.update((current) => ({
            ...current,
            status: "error",
            formErrors: [message],
            lastResult: null,
          }));

          syncDerivedFieldState({
            preserveValidationErrors: true,
            preserveExternalErrors: true,
          });
        }

        await config.hooks?.onSubmitError?.({
          values,
          serializedValues,
          submitCount,
          error,
        });

        throw new SubmitError(`Form submission failed: ${message}`, error);
      } finally {
        if (currentSubmissionRequestId === submissionRequestId) {
          currentSubmissionRequestId = null;
        }
        activeAbortController = null;
        activeAbortReason = "";
        abortedSubmissionReasons.delete(submissionRequestId);

        store.update((current) => ({
          ...current,
          activeSubmissionVersion:
            current.activeSubmissionVersion === submissionRequestId
              ? null
              : current.activeSubmissionVersion,
        }));
      }
    },
    abortSubmit(reason) {
      if (currentSubmissionRequestId === null) {
        return;
      }

      const abortReason = reason ?? "";
      abortedSubmissionReasons.set(currentSubmissionRequestId, abortReason);
      activeAbortReason = abortReason;
      activeAbortController?.abort(abortReason);
    },
    reset() {
      this.abortSubmit("reset");
      bumpLifecycleVersion();

      for (const field of fields) {
        field.reset();
      }
      for (const report of reports) {
        report.reset();
      }

      currentSubmissionRequestId = null;
      activeAbortController = null;
      activeAbortReason = "";
      abortedSubmissionReasons.clear();

      store.update((current) => ({
        ...current,
        status: "idle",
        formErrors: [],
        lastResult: null,
        activeSubmissionVersion: null,
      }));

      syncDerivedFieldState({
        preserveValidationErrors: false,
        preserveExternalErrors: false,
      });
    },
    subscribe(listener) {
      return store.subscribe(() => {
        listener(this.state);
      });
    },
    subscribeSelector<TSelected>(
      selector: (state: ReturnType<typeof toFormState>) => TSelected,
      listener: (selected: TSelected, state: ReturnType<typeof toFormState>) => void,
      options?: SelectorSubscriptionOptions<TSelected>,
    ) {
      const equality = options?.equality ?? shallowEquality<TSelected>;
      let previousSelected = selector(this.state);

      if (options?.emitInitial) {
        listener(previousSelected, this.state);
      }

      return store.subscribe(() => {
        const nextState = this.state;
        const nextSelected = selector(nextState);
        if (!equality(previousSelected, nextSelected)) {
          previousSelected = nextSelected;
          listener(nextSelected, nextState);
        }
      });
    },
  };

  syncDerivedFieldState({
    preserveValidationErrors: false,
    preserveExternalErrors: false,
  });

  return controller;
};
