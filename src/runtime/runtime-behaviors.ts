// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { Registry } from "@/schema";
import { normalizeSchemaId } from "@/schema";
import { isPromiseLike, notifyListenerError } from "./utils";
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
  let changeVersion = 0;
  let activeChangeController: AbortController | null = null;
  let activeChangeCompletion: Promise<void> | null = null;

  const resolveField = (targetId: string): InternalFieldController | undefined => {
    return fieldMap.get(targetId) ?? fieldMap.get(normalizeSchemaId(targetId));
  };

  const createBehaviorContext = (
    signal?: AbortSignal,
    version?: number,
  ): RuntimeBehaviorContext => ({
    registry,
    fields,
    signal,
    changeVersion: version,
    getField(id) {
      return resolveField(id);
    },
    resolveFieldId(id) {
      return resolveField(id)?.id;
    },
    getValues,
    getSubmitCount,
    getFormStatus,
    commitDerivedValue(fieldId, value) {
      if (signal?.aborted || (version !== undefined && version !== changeVersion)) return;
      commitDerivedValue(fieldId, value);
    },
    syncDerivedState(values) {
      if (signal?.aborted || (version !== undefined && version !== changeVersion)) return;
      syncDerivedState(values ?? getValues());
    },
  });

  const runBehaviorValueChanges = (events: readonly RuntimeBehaviorValueChangeEvent[]): void => {
    activeChangeController?.abort("values-changed");
    const controller = new AbortController();
    activeChangeController = controller;
    const version = ++changeVersion;
    const context = createBehaviorContext(controller.signal, version);
    const pending: Promise<void>[] = [];
    for (const event of events) {
      for (const behavior of behaviors) {
        const result = behavior.onValuesChanged?.(event, context);
        if (isPromiseLike(result)) {
          pending.push(
            Promise.resolve(result).catch((error: unknown) => {
              if (!controller.signal.aborted) notifyListenerError(onListenerError, error);
            }),
          );
        }
      }
    }
    if (pending.length === 0) {
      if (activeChangeController === controller) activeChangeController = null;
      activeChangeCompletion = null;
      return;
    }
    const aborted = new Promise<void>((resolve) => {
      controller.signal.addEventListener("abort", () => resolve(), { once: true });
    });
    const generation = changeVersion;
    const completion = Promise.race([Promise.all(pending).then(() => undefined), aborted]).finally(
      () => {
        if (activeChangeController === controller) activeChangeController = null;
        if (changeVersion === generation) activeChangeCompletion = null;
      },
    );
    activeChangeCompletion = completion;
  };

  const runBehaviorValueChange = (event: RuntimeBehaviorValueChangeEvent): void => {
    runBehaviorValueChanges([event]);
  };

  const flushBehaviorChanges = (): Promise<void> | undefined => {
    if (!activeChangeCompletion) return undefined;

    return (async () => {
      while (activeChangeCompletion) {
        const completion: Promise<void> = activeChangeCompletion;
        await completion;
        if (activeChangeCompletion === completion) {
          activeChangeCompletion = null;
        }
      }
    })();
  };

  const abortBehaviorChanges = (reason?: string): void => {
    changeVersion += 1;
    activeChangeController?.abort(reason);
    activeChangeController = null;
    activeChangeCompletion = null;
  };

  const validateBehaviors = (): void => {
    const context = createBehaviorContext();
    for (const behavior of behaviors) {
      behavior.validate?.(context);
    }
  };

  const runBeforeSubmitRecords = async (
    records: import("./types").RuntimeBehaviorSubmissionRecords,
    signal?: AbortSignal,
  ): Promise<void> => {
    const context = createBehaviorContext(signal);
    for (const behavior of behaviors) {
      await behavior.beforeSubmitRecords?.(records, context);
    }
  };

  return {
    createBehaviorContext,
    runBehaviorValueChange,
    runBehaviorValueChanges,
    flushBehaviorChanges,
    runBeforeSubmitRecords,
    validateBehaviors,
    abortBehaviorChanges,
    fieldMap,
    resolveField,
  };
};
