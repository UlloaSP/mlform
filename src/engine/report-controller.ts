// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { EngineStore } from "./internal";
import type {
  NormalizedReportConfig,
  ReportController,
  ReportDefinition,
  ReportStateSnapshot,
  SubmitResult,
} from "./types";
import { defaultEquality } from "./utils";

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

export const createReportController = ({
  config,
  definition,
  store,
}: CreateReportControllerOptions): ReportController & {
  prepareState(result: SubmitResult): ReportStateSnapshot;
  commitState(state: ReportStateSnapshot): void;
  update(result: SubmitResult): void;
  reset(): void;
} => {
  setReportState(store, config.id, idleState);

  const controller: ReportController & {
    prepareState(result: SubmitResult): ReportStateSnapshot;
    commitState(state: ReportStateSnapshot): void;
    update(result: SubmitResult): void;
    reset(): void;
  } = {
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
      return store.getState().reportStates[config.id];
    },
    get descriptor() {
      return definition.describe(config, {
        reportId: config.id,
        state: this.state,
        payload: this.state.payload,
        result: store.getState().lastResult,
      });
    },
    prepareState(result) {
      try {
        const payload = definition.resolvePayload
          ? definition.resolvePayload(config, {
              report: config,
              result,
            })
          : result.reports[config.source];

        return {
          payload,
          error: null,
          status: payload === undefined ? "idle" : "ready",
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          payload: undefined,
          error: message,
          status: "error",
        };
      }
    },
    commitState(state) {
      setReportState(store, config.id, state);
    },
    update(result) {
      this.commitState(this.prepareState(result));
    },
    reset() {
      setReportState(store, config.id, idleState);
    },
    subscribe(listener) {
      let previousState = this.state;
      return store.subscribe(() => {
        const nextState = store.getState().reportStates[config.id];
        if (!defaultEquality(previousState, nextState)) {
          previousState = nextState;
          listener(nextState);
        }
      });
    },
  };

  return controller;
};
