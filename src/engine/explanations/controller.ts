// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { defaultEquality } from "../equality";
import { isAbortLikeError } from "../errors";
import type { EngineStore } from "../state";
import type {
  ExplanationController,
  ExplanationDefinition,
  ExplanationDescriptor,
  ExplanationFetchRequest,
  ExplanationStateSnapshot,
  FormHooks,
  NormalizedExplanationConfig,
} from "../types";
import { deepFreeze } from "../utils";
import { cloneValue } from "../values";

type CreateExplanationControllerOptions = {
  config: NormalizedExplanationConfig;
  definition: ExplanationDefinition;
  store: EngineStore;
  hooks: FormHooks | undefined;
};

const idleState: ExplanationStateSnapshot = {
  status: "idle",
  result: undefined,
  error: null,
};

const extractErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === "string" && error.trim().length > 0) return error;
  return String(error);
};

const setExplanationState = (
  store: EngineStore,
  explanationId: string,
  nextState: ExplanationStateSnapshot,
): void => {
  store.update((current) => ({
    ...current,
    explanationStates: {
      ...current.explanationStates,
      [explanationId]: nextState,
    },
  }));
};

export type InternalExplanationController = ExplanationController & {
  reset(): void;
};

export const createExplanationController = ({
  config,
  definition,
  store,
  hooks,
}: CreateExplanationControllerOptions): InternalExplanationController => {
  const readonlyConfig = deepFreeze(cloneValue(config));
  setExplanationState(store, readonlyConfig.id, idleState);

  let abortController: AbortController | null = null;

  const controller: InternalExplanationController = {
    get id() {
      return readonlyConfig.id;
    },
    get kind() {
      return readonlyConfig.kind;
    },
    get config() {
      return readonlyConfig;
    },
    get state(): ExplanationStateSnapshot {
      const raw = store.getState().explanationStates[readonlyConfig.id] ?? idleState;
      return cloneValue(raw) as ExplanationStateSnapshot;
    },
    get descriptor(): ExplanationDescriptor | null {
      const raw = store.getState().explanationStates[readonlyConfig.id] ?? idleState;
      return definition.describe(readonlyConfig, {
        explanationId: readonlyConfig.id,
        state: cloneValue(raw) as ExplanationStateSnapshot,
      });
    },
    async fetch(request: ExplanationFetchRequest): Promise<void> {
      const currentState = store.getState().explanationStates[readonlyConfig.id] ?? idleState;
      if (currentState.status !== "idle") {
        return;
      }

      abortController?.abort();
      const ac = new AbortController();
      abortController = ac;

      setExplanationState(store, readonlyConfig.id, {
        status: "loading",
        result: undefined,
        error: null,
      });

      const transport = definition.transport(readonlyConfig);

      try {
        const result = await transport.submit({ ...request, signal: ac.signal });

        if (ac.signal.aborted) {
          return;
        }

        setExplanationState(store, readonlyConfig.id, {
          status: "done",
          result,
          error: null,
        });

        await hooks?.afterExplanation?.({
          explanationId: readonlyConfig.id,
          kind: readonlyConfig.kind,
          result,
        });
      } catch (err: unknown) {
        if (ac.signal.aborted || isAbortLikeError(err)) {
          return;
        }

        const message = extractErrorMessage(err);

        setExplanationState(store, readonlyConfig.id, {
          status: "error",
          result: undefined,
          error: message,
        });

        await hooks?.onExplanationError?.({
          explanationId: readonlyConfig.id,
          kind: readonlyConfig.kind,
          error: err,
        });
      } finally {
        if (abortController === ac) {
          abortController = null;
        }
      }
    },
    abort() {
      abortController?.abort();
      abortController = null;
      setExplanationState(store, readonlyConfig.id, idleState);
    },
    reset() {
      abortController?.abort();
      abortController = null;
      setExplanationState(store, readonlyConfig.id, idleState);
    },
    subscribe(listener) {
      let previousState = store.getState().explanationStates[readonlyConfig.id] ?? idleState;
      return store.subscribe(() => {
        const nextState = store.getState().explanationStates[readonlyConfig.id] ?? idleState;
        if (!defaultEquality(previousState, nextState)) {
          previousState = nextState;
          listener(cloneValue(nextState) as ExplanationStateSnapshot);
        }
      });
    },
  };

  return controller;
};
