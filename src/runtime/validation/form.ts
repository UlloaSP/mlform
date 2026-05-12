// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { EngineError } from "../errors";
import type { NormalizedFormSchema } from "../schema";
import type { EngineStore } from "../state";
import { toFieldStateSnapshots, toFormState, transitionEngineState } from "../state";
import type {
  FieldValidationResult,
  FormHooks,
  FormStatus,
  FormValidationContext,
  FormValidationIssue,
  FormValidationResult,
  FormValidator,
  InactiveFieldPolicy,
} from "../types";

type FormValidationField = {
  readonly id: string;
  validate(validationVersion?: number): Promise<FieldValidationResult>;
  setExternalErrors(errors: string[]): void;
};

type SyncDerivedFieldStateOptions = {
  values?: Record<string, unknown>;
  preserveValidationErrors?: boolean;
  preserveExternalErrors?: boolean;
  resetInactiveToInitial?: boolean;
  inactiveFieldPolicy?: InactiveFieldPolicy;
};

type CreateFormValidatorOptions = {
  store: EngineStore;
  fields: readonly FormValidationField[];
  normalizedSchema: NormalizedFormSchema;
  validators?: FormValidator[];
  hooks?: FormHooks;
  getValues: () => Record<string, unknown>;
  getSubmitCount: () => number;
  getFormStatus: () => FormStatus;
  syncDerivedFieldState: (options?: SyncDerivedFieldStateOptions) => void;
  setRestingStatus: () => void;
  shouldResetInactiveFields: () => boolean;
  inactiveFieldPolicy?: InactiveFieldPolicy;
};

export const createValidationResult = (store: EngineStore): FormValidationResult => {
  const state = toFormState(store.getState());
  return {
    valid: state.valid,
    fields: state.errors.fields,
    formErrors: state.errors.form,
  };
};

export const mergeValidationIssue = (
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

export const createFormValidator = ({
  store,
  fields,
  normalizedSchema,
  validators,
  hooks,
  getValues,
  getSubmitCount,
  getFormStatus,
  syncDerivedFieldState,
  setRestingStatus,
  shouldResetInactiveFields,
  inactiveFieldPolicy,
}: CreateFormValidatorOptions): {
  validate(): Promise<FormValidationResult>;
} => {
  let validationSequence = 0;
  const fieldIds = new Set(fields.map((field) => field.id));

  const validateFormRules = async (
    validationVersion: number,
    lifecycleVersion: number,
  ): Promise<FormValidationResult> => {
    const formErrors: string[] = [];
    const fieldErrors: Record<string, string[]> = Object.fromEntries(
      fields.map((field) => [field.id, []]),
    ) as Record<string, string[]>;

    if (validators?.length) {
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

      for (const validator of validators) {
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
      (fieldId) => !fieldIds.has(fieldId),
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

  return {
    async validate() {
      const lifecycleVersion = store.getState().lifecycleVersion;
      const validationVersion = ++validationSequence;

      store.update((current) =>
        transitionEngineState(current, {
          type: "start-validation",
          validationVersion,
        }),
      );

      try {
        await hooks?.beforeValidate?.({
          values: getValues(),
          submitCount: getSubmitCount(),
        });

        await Promise.all(fields.map((field) => field.validate(validationVersion)));

        if (store.getState().lifecycleVersion !== lifecycleVersion) {
          return createValidationResult(store);
        }

        syncDerivedFieldState({
          preserveValidationErrors: true,
          preserveExternalErrors: false,
          resetInactiveToInitial: shouldResetInactiveFields(),
          inactiveFieldPolicy,
        });

        const result = await validateFormRules(validationVersion, lifecycleVersion);

        await hooks?.afterValidate?.({
          values: getValues(),
          result,
          submitCount: getSubmitCount(),
        });

        if (store.getState().activeValidationVersion === validationVersion) {
          setRestingStatus();
        }

        return result;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);

        if (
          store.getState().activeValidationVersion === validationVersion &&
          store.getState().lifecycleVersion === lifecycleVersion
        ) {
          store.update((current) =>
            transitionEngineState(current, {
              type: "validation-error",
              message,
            }),
          );

          syncDerivedFieldState({
            preserveValidationErrors: true,
            preserveExternalErrors: true,
            resetInactiveToInitial: shouldResetInactiveFields(),
            inactiveFieldPolicy,
          });
        }

        throw error;
      }
    },
  };
};
