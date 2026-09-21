// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { FormTransition } from "../types";
import type { EngineState, EngineStore } from "./engine";
import { createStore } from "./store";

type EngineStoreOptions = {
  listenerErrorPolicy?: "ignore" | "throw-aggregate";
  onListenerError?: (error: unknown, state: EngineState) => void;
};

export const createEngineStore = (
  initialState: EngineState,
  options: EngineStoreOptions = {},
): EngineStore => {
  const stateStore = createStore(initialState, options);
  const transitionStore = createStore<FormTransition | null>(null, {
    listenerErrorPolicy: options.listenerErrorPolicy,
    onListenerError: (error) => options.onListenerError?.(error, stateStore.getState()),
  });
  const pendingTransitions: FormTransition[] = [];
  let batchDepth = 0;
  let mutationDepth = 0;
  let flushing = false;

  const queueTransition = (previous: EngineState, next: EngineState): void => {
    if (next.transitionSequence !== previous.transitionSequence && next.lastTransition !== null) {
      pendingTransitions.push(next.lastTransition);
    }
  };

  const flushTransitions = (): void => {
    if (batchDepth > 0 || mutationDepth > 0 || flushing) return;
    flushing = true;
    const errors: unknown[] = [];
    try {
      while (pendingTransitions.length > 0) {
        try {
          transitionStore.setState(pendingTransitions.shift()!);
        } catch (error) {
          errors.push(error);
        }
      }
    } finally {
      flushing = false;
    }
    if (errors.length === 1) throw errors[0];
    if (errors.length > 1) {
      throw new AggregateError(errors, "Transition listener notification failed.");
    }
  };

  return {
    getState: () => stateStore.getState(),
    setState(nextState) {
      mutationDepth += 1;
      try {
        const previous = stateStore.getState();
        queueTransition(previous, nextState);
        stateStore.setState(nextState);
      } finally {
        mutationDepth -= 1;
        flushTransitions();
      }
    },
    update(updater) {
      mutationDepth += 1;
      try {
        stateStore.update((previous) => {
          const next = updater(previous);
          queueTransition(previous, next);
          return next;
        });
      } finally {
        mutationDepth -= 1;
        flushTransitions();
      }
    },
    batch(callback) {
      batchDepth += 1;
      try {
        stateStore.batch(callback);
      } finally {
        batchDepth -= 1;
        flushTransitions();
      }
    },
    subscribe: (listener) => stateStore.subscribe(listener),
    subscribeTransitions(listener) {
      return transitionStore.subscribe((transition) => {
        if (transition) listener(transition);
      });
    },
    destroy() {
      pendingTransitions.length = 0;
      stateStore.destroy();
      transitionStore.destroy();
    },
  };
};
