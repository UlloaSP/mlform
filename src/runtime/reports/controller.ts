// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { defaultEquality } from "../equality";
import { resolveMappedReportPayload, resolveMappedReportResult } from "@/schema";
import { createTransportRequestRunner } from "@/transport";
import { EngineError, ReportPayloadError } from "../errors";
import type { EngineStore } from "../state";
import type {
  FormHooks,
  NormalizedReportConfig,
  ReportController,
  ReportDefinition,
  ReportFetchRequest,
  ReportStateSnapshot,
  SubmitResult,
} from "../types";
import { deepFreeze, notifyListenerError } from "../utils";
import { cloneValue } from "../values";
import { cloneReportStateSnapshot, preparePayloadState } from "./payload-state";

type CreateReportControllerOptions = {
  config: NormalizedReportConfig;
  definition: ReportDefinition;
  store: EngineStore;
  hooks: FormHooks | undefined;
  onListenerError?: (error: unknown) => void;
};

const idleState: ReportStateSnapshot = {
  payload: undefined,
  error: null,
  status: "idle",
};

const loadingState: ReportStateSnapshot = {
  payload: undefined,
  error: null,
  status: "loading",
};

const setReportState = (
  store: EngineStore,
  reportId: string,
  nextState: ReportStateSnapshot,
): void => {
  store.update((current) => ({
    ...current,
    reportStates: {
      ...current.reportStates,
      [reportId]: nextState,
    },
  }));
};

export type InternalReportController = ReportController & {
  cloneState(state: ReportStateSnapshot): ReportStateSnapshot;
  prepareState(result: SubmitResult, signal?: AbortSignal): Promise<ReportStateSnapshot>;
  commitState(state: ReportStateSnapshot): void;
  update(result: SubmitResult): Promise<void>;
  markLoading(): void;
  reset(): void;
  suspend(reason?: string): void;
  dispose(): void;
};

export const createReportController = ({
  config,
  definition,
  store,
  hooks,
  onListenerError,
}: CreateReportControllerOptions): InternalReportController => {
  let disposed = false;
  const assertUsable = (): void => {
    if (disposed) throw new EngineError(`Report "${config.id}" has been disposed.`);
  };
  const assertActive = (): void => {
    assertUsable();
    if (store.getState().lifecycle === "suspended") {
      throw new EngineError(`Report "${config.id}" belongs to a suspended form.`);
    }
  };
  const readonlyConfig = deepFreeze(cloneValue(config));
  setReportState(store, readonlyConfig.id, idleState);

  const fetchRunner = createTransportRequestRunner();

  const controller: InternalReportController = {
    get id() {
      return readonlyConfig.id;
    },
    get kind() {
      return readonlyConfig.kind;
    },
    get config() {
      return readonlyConfig;
    },
    get canFetch() {
      return definition.fetch !== undefined;
    },
    get state() {
      return cloneReportStateSnapshot(
        definition,
        readonlyConfig,
        store.getState().reportStates[readonlyConfig.id],
      );
    },
    cloneState(state) {
      return cloneReportStateSnapshot(definition, readonlyConfig, state);
    },
    async prepareState(result, signal) {
      let rawPayload: unknown;

      try {
        const mappedResult = resolveMappedReportResult(readonlyConfig, result);
        if (mappedResult?.status === "skipped") {
          return { payload: undefined, error: null, status: "skipped" };
        }
        rawPayload = definition.resolvePayload
          ? await definition.resolvePayload(readonlyConfig, {
              report: readonlyConfig,
              result,
              signal,
            })
          : definition.fetch && readonlyConfig.mappedTo === undefined
            ? undefined
            : resolveMappedReportPayload(readonlyConfig, result);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          payload: undefined,
          error: message,
          status: "error",
        };
      }

      return preparePayloadState(
        definition,
        readonlyConfig,
        rawPayload,
        (message, error) => new ReportPayloadError(readonlyConfig.id, message, error),
      );
    },
    commitState(state) {
      setReportState(store, readonlyConfig.id, this.cloneState(state));
    },
    async update(result) {
      this.commitState(await this.prepareState(result));
    },
    markLoading() {
      setReportState(store, readonlyConfig.id, loadingState);
    },
    async fetch(request: ReportFetchRequest): Promise<void> {
      assertActive();
      const currentState = store.getState().reportStates[readonlyConfig.id] ?? idleState;
      if (!definition.fetch || currentState.status !== "idle") {
        return;
      }

      setReportState(store, readonlyConfig.id, loadingState);

      const transport = definition.fetch({
        config: readonlyConfig,
        reportId: readonlyConfig.id,
      });

      const outcome = await fetchRunner.run(
        (signal) => transport.submit({ ...request, signal }),
        [request.signal],
      );

      if (outcome.stale) return;

      if (outcome.status === "aborted") {
        setReportState(store, readonlyConfig.id, idleState);
        return;
      }

      if (outcome.status === "completed") {
        const nextState = preparePayloadState(
          definition,
          readonlyConfig,
          outcome.value,
          (_message, error) => (error instanceof Error ? error : new Error(String(error))),
        );
        setReportState(store, readonlyConfig.id, nextState);

        if (nextState.status === "ready") {
          try {
            await hooks?.afterReportFetch?.({
              reportId: readonlyConfig.id,
              kind: readonlyConfig.kind,
              payload: nextState.payload,
            });
          } catch (error) {
            notifyListenerError(onListenerError, error);
          }
        }
        return;
      }

      setReportState(store, readonlyConfig.id, {
        payload: undefined,
        error: outcome.message,
        status: "error",
      });

      try {
        await hooks?.onReportFetchError?.({
          reportId: readonlyConfig.id,
          kind: readonlyConfig.kind,
          error: outcome.error,
        });
      } catch (error) {
        notifyListenerError(onListenerError, error);
      }
    },
    async refresh(request) {
      assertActive();
      this.abort();
      await this.fetch(request);
    },
    abort() {
      fetchRunner.abort();
      setReportState(store, readonlyConfig.id, idleState);
    },
    reset() {
      fetchRunner.abort();
      setReportState(store, readonlyConfig.id, idleState);
    },
    suspend(reason) {
      fetchRunner.abort(reason);
      if (store.getState().reportStates[readonlyConfig.id]?.status === "loading") {
        setReportState(store, readonlyConfig.id, idleState);
      }
    },
    subscribe(listener) {
      assertUsable();
      let previousState = store.getState().reportStates[readonlyConfig.id];
      return store.subscribe(() => {
        const nextState = store.getState().reportStates[readonlyConfig.id];
        if (!defaultEquality(previousState, nextState)) {
          previousState = nextState;
          listener(this.cloneState(nextState));
        }
      });
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      fetchRunner.abort("dispose");
    },
  };

  return controller;
};
