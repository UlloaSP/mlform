// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { defaultEquality } from "../equality";
import { createAsyncRequestRunner, extractErrorMessage } from "@/shared";
import { ReportPayloadError } from "../errors";
import type { EngineStore } from "../state";
import type {
  FormHooks,
  NormalizedReportConfig,
  PartialReportUpdatePolicy,
  ReportController,
  ReportDefinition,
  ReportFetchRequest,
  ReportStateSnapshot,
  SubmitResult,
} from "../types";
import { deepFreeze } from "../utils";
import { cloneValue } from "../values";

type CreateReportControllerOptions = {
  config: NormalizedReportConfig;
  definition: ReportDefinition;
  store: EngineStore;
  hooks: FormHooks | undefined;
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

const cloneReportPayload = (
  definition: ReportDefinition,
  config: NormalizedReportConfig,
  payload: unknown,
): unknown => {
  if (payload === undefined) {
    return undefined;
  }

  if (definition.clonePayload) {
    return definition.clonePayload(payload, config);
  }

  return cloneValue(payload);
};

export const cloneReportStateSnapshot = (
  definition: ReportDefinition,
  config: NormalizedReportConfig,
  state: ReportStateSnapshot,
): ReportStateSnapshot => {
  return {
    payload: cloneReportPayload(definition, config, state.payload),
    error: state.error,
    status: state.status,
  };
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

const preparePayloadState = (
  definition: ReportDefinition,
  config: NormalizedReportConfig,
  rawPayload: unknown,
  errorFactory: (message: string, error: unknown) => Error,
): ReportStateSnapshot => {
  if (rawPayload === undefined || !definition.payloadSchema) {
    return {
      payload: cloneReportPayload(definition, config, rawPayload),
      error: null,
      status: rawPayload === undefined ? "idle" : "ready",
    };
  }

  try {
    const payload = definition.payloadSchema.parse(rawPayload);
    return {
      payload: cloneReportPayload(definition, config, payload),
      error: null,
      status: "ready",
    };
  } catch (error) {
    const message = extractErrorMessage(error);
    if (definition.payloadValidationPolicy === "fail-submit") {
      throw errorFactory(message, error);
    }

    return {
      payload: undefined,
      error: message,
      status: "error",
    };
  }
};

export type InternalReportController = ReportController & {
  cloneState(state: ReportStateSnapshot): ReportStateSnapshot;
  prepareState(result: SubmitResult): Promise<ReportStateSnapshot>;
  commitState(state: ReportStateSnapshot): void;
  update(result: SubmitResult): Promise<void>;
  markLoading(): void;
  reset(): void;
  readonly partialUpdatePolicy: PartialReportUpdatePolicy;
};

export const createReportController = ({
  config,
  definition,
  store,
  hooks,
}: CreateReportControllerOptions): InternalReportController => {
  const readonlyConfig = deepFreeze(cloneValue(config));
  setReportState(store, readonlyConfig.id, idleState);

  const fetchRunner = createAsyncRequestRunner();

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
    get partialUpdatePolicy() {
      return definition.partialUpdatePolicy ?? "trust";
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
    async prepareState(result) {
      let rawPayload: unknown;

      try {
        rawPayload = definition.resolvePayload
          ? await definition.resolvePayload(readonlyConfig, {
              report: readonlyConfig,
              result,
            })
          : result.reports[readonlyConfig.source];
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
          await hooks?.afterReportFetch?.({
            reportId: readonlyConfig.id,
            kind: readonlyConfig.kind,
            payload: nextState.payload,
          });
        }
        return;
      }

      setReportState(store, readonlyConfig.id, {
        payload: undefined,
        error: outcome.message,
        status: "error",
      });

      await hooks?.onReportFetchError?.({
        reportId: readonlyConfig.id,
        kind: readonlyConfig.kind,
        error: outcome.error,
      });
    },
    abort() {
      fetchRunner.abort();
      setReportState(store, readonlyConfig.id, idleState);
    },
    reset() {
      fetchRunner.abort();
      setReportState(store, readonlyConfig.id, idleState);
    },
    subscribe(listener) {
      let previousState = store.getState().reportStates[readonlyConfig.id];
      return store.subscribe(() => {
        const nextState = store.getState().reportStates[readonlyConfig.id];
        if (!defaultEquality(previousState, nextState)) {
          previousState = nextState;
          listener(this.cloneState(nextState));
        }
      });
    },
  };

  return controller;
};
