// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { Registry } from "@/schema";
import { normalizeSchemaId } from "@/schema";
import { isPromiseLike } from "./utils";
import type { InternalFieldController } from "./fields";
import type {
  CreateFormConfig,
  FormState,
  RuntimeBehavior,
  RuntimeBehaviorContext,
  RuntimeBehaviorValueChangeEvent,
} from "./types";

type CreateRuntimeBehaviorsOptions = {
  registry: Registry;
  behaviors: RuntimeBehavior[];
  fields: readonly InternalFieldController[];
  getValues: () => Record<string, unknown>;
  getSubmitCount: () => number;
  getFormStatus: () => FormState["status"];
  commitDerivedValue: (targetId: string, value: unknown) => void;
  syncDerivedState: (values: Record<string, unknown>) => void;
  onListenerError: CreateFormConfig["onListenerError"];
};

export const createRuntimeBehaviors = ({
  registry,
  behaviors,
  fields,
  getValues,
  getSubmitCount,
  getFormStatus,
  commitDerivedValue,
  syncDerivedState,
  onListenerError,
}: CreateRuntimeBehaviorsOptions) => {
  const fieldMap = new Map<string, InternalFieldController>(
    fields.map((field) => [field.id, field]),
  );

  const resolveField = (targetId: string): InternalFieldController | undefined => {
    return fieldMap.get(targetId) ?? fieldMap.get(normalizeSchemaId(targetId));
  };

  const createBehaviorContext = (): RuntimeBehaviorContext => ({
    registry,
    fields,
    getField(id) {
      return resolveField(id);
    },
    resolveFieldId(id) {
      return resolveField(id)?.id;
    },
    getValues,
    getSubmitCount,
    getFormStatus,
    commitDerivedValue,
    syncDerivedState,
  });

  const runBehaviorValueChange = (event: RuntimeBehaviorValueChangeEvent): void => {
    const context = createBehaviorContext();
    for (const behavior of behaviors) {
      const result = behavior.onValuesChanged?.(event, context);
      if (isPromiseLike(result)) {
        void Promise.resolve(result).catch((error: unknown) => {
          onListenerError?.(error);
        });
      }
    }
  };

  const validateBehaviors = (): void => {
    const context = createBehaviorContext();
    for (const behavior of behaviors) {
      behavior.validate?.(context);
    }
  };

  const runBeforeSubmitRecords = async (
    records: import("./types").RuntimeBehaviorSubmissionRecords,
  ): Promise<void> => {
    const context = createBehaviorContext();
    for (const behavior of behaviors) {
      await behavior.beforeSubmitRecords?.(records, context);
    }
  };

  return {
    createBehaviorContext,
    runBehaviorValueChange,
    runBeforeSubmitRecords,
    validateBehaviors,
    fieldMap,
    resolveField,
  };
};
