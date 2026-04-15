// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { defaultEquality } from "../equality";
import { ReportPayloadError } from "../errors";
import type { EngineStore } from "../state";
import type {
  NormalizedReportConfig,
  PartialReportUpdatePolicy,
  ReportController,
  ReportDefinition,
  ReportStateSnapshot,
  SubmitResult,
} from "../types";
import { deepFreeze } from "../utils";
import { cloneValue } from "../values";

type CreateReportControllerOptions = {
  config: NormalizedReportConfig;
  definition: ReportDefinition;
  store: EngineStore;
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
}: CreateReportControllerOptions): InternalReportController => {
  const readonlyConfig = deepFreeze(cloneValue(config));
  setReportState(store, readonlyConfig.id, idleState);

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
    get state() {
      return cloneReportStateSnapshot(
        definition,
        readonlyConfig,
        store.getState().reportStates[readonlyConfig.id],
      );
    },
    get descriptor() {
      const state = this.state;
      return definition.describe(readonlyConfig, {
        reportId: readonlyConfig.id,
        state,
        payload: state.payload,
        result: cloneValue(store.getState().lastResult),
      });
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

      if (rawPayload === undefined || !definition.payloadSchema) {
        return {
          payload: cloneReportPayload(definition, readonlyConfig, rawPayload),
          error: null,
          status: rawPayload === undefined ? "idle" : "ready",
        };
      }

      try {
        const payload = definition.payloadSchema.parse(rawPayload);
        return {
          payload: cloneReportPayload(definition, readonlyConfig, payload),
          error: null,
          status: "ready",
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (definition.payloadValidationPolicy === "fail-submit") {
          throw new ReportPayloadError(readonlyConfig.id, message, error);
        }

        return {
          payload: undefined,
          error: message,
          status: "error",
        };
      }
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
    reset() {
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
