// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

export interface Store<T> {
  getState(): T;
  setState(nextState: T): void;
  update(updater: (current: T) => T): void;
  batch(callback: () => void): void;
  subscribe(listener: (state: T) => void): () => void;
  destroy(): void;
}

type StoreOptions<T> = {
  listenerErrorPolicy?: "ignore" | "throw-aggregate";
  onListenerError?: (error: unknown, state: T) => void;
};

const toAggregateListenerError = (errors: unknown[]): unknown => {
  if (typeof AggregateError !== "undefined") {
    return new AggregateError(errors, "Store listener notification failed.");
  }

  return new Error("Store listener notification failed.");
};

export const createStore = <T>(initialState: T, options: StoreOptions<T> = {}): Store<T> => {
  let state = initialState;
  let batchDepth = 0;
  let hasPendingNotification = false;
  let destroyed = false;
  const listeners = new Set<(state: T) => void>();

  const notify = () => {
    const errors: unknown[] = [];

    for (const listener of listeners) {
      try {
        listener(state);
      } catch (error) {
        errors.push(error);
        options.onListenerError?.(error, state);
      }
    }

    if (errors.length > 0 && options.listenerErrorPolicy === "throw-aggregate") {
      throw toAggregateListenerError(errors);
    }
  };

  return {
    getState() {
      return state;
    },
    setState(nextState) {
      if (destroyed) return;
      state = nextState;
      if (batchDepth > 0) {
        hasPendingNotification = true;
        return;
      }
      notify();
    },
    update(updater) {
      if (destroyed) return;
      this.setState(updater(state));
    },
    batch(callback) {
      if (destroyed) return;
      batchDepth += 1;
      try {
        callback();
      } finally {
        batchDepth -= 1;
        if (batchDepth === 0 && hasPendingNotification) {
          hasPendingNotification = false;
          notify();
        }
      }
    },
    subscribe(listener) {
      if (destroyed) return () => {};
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    destroy() {
      destroyed = true;
      hasPendingNotification = false;
      listeners.clear();
    },
  };
};
