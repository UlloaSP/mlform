// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { defaultEquality } from "../equality";
import { ReportPayloadError } from "../errors";
import type { EngineStore } from "../state";
import type {
  NormalizedReportConfig,
  ReportController,
  ReportDefinition,
  ReportStateSnapshot,
  SubmitResult,
} from "../types";
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
};

export const createReportController = ({
  config,
  definition,
  store,
}: CreateReportControllerOptions): InternalReportController => {
  setReportState(store, config.id, idleState);

  const controller: InternalReportController = {
    get id() {
      return config.id;
    },
    get kind() {
      return config.kind;
    },
    get config() {
      return config;
    },
    get state() {
      return cloneReportStateSnapshot(definition, config, store.getState().reportStates[config.id]);
    },
    get descriptor() {
      const state = this.state;
      return definition.describe(config, {
        reportId: config.id,
        state,
        payload: state.payload,
        result: cloneValue(store.getState().lastResult),
      });
    },
    cloneState(state) {
      return cloneReportStateSnapshot(definition, config, state);
    },
    async prepareState(result) {
      let rawPayload: unknown;

      try {
        rawPayload = definition.resolvePayload
          ? await definition.resolvePayload(config, {
              report: config,
              result,
            })
          : result.reports[config.source];
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
        const message = error instanceof Error ? error.message : String(error);
        if (definition.payloadValidationPolicy === "fail-submit") {
          throw new ReportPayloadError(config.id, message, error);
        }

        return {
          payload: undefined,
          error: message,
          status: "error",
        };
      }
    },
    commitState(state) {
      setReportState(store, config.id, this.cloneState(state));
    },
    async update(result) {
      this.commitState(await this.prepareState(result));
    },
    markLoading() {
      setReportState(store, config.id, loadingState);
    },
    reset() {
      setReportState(store, config.id, idleState);
    },
    subscribe(listener) {
      let previousState = store.getState().reportStates[config.id];
      return store.subscribe(() => {
        const nextState = store.getState().reportStates[config.id];
        if (!defaultEquality(previousState, nextState)) {
          previousState = nextState;
          listener(this.cloneState(nextState));
        }
      });
    },
  };

  return controller;
};
