// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

export interface Store<T> {
  getState(): T;
  setState(nextState: T): void;
  update(updater: (current: T) => T): void;
  subscribe(listener: (state: T) => void): () => void;
}

export const createStore = <T>(initialState: T): Store<T> => {
  let state = initialState;
  const listeners = new Set<(state: T) => void>();

  return {
    getState() {
      return state;
    },
    setState(nextState) {
      state = nextState;
      for (const listener of listeners) {
        listener(state);
      }
    },
    update(updater) {
      this.setState(updater(state));
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
};
