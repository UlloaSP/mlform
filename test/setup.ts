// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { beforeAll } from "vite-plus/test";

declare global {
  interface Window {
    __setPreferredColorScheme?: (scheme: "light" | "dark") => void;
  }
}

// Setup DOM environment
beforeAll(() => {
  let matches = false;
  const listeners = new Set<(event: MediaQueryListEvent) => void>();

  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      get matches() {
        return matches;
      },
      media: query,
      onchange: null,
      addListener: (listener: (event: MediaQueryListEvent) => void) => {
        listeners.add(listener);
      },
      removeListener: (listener: (event: MediaQueryListEvent) => void) => {
        listeners.delete(listener);
      },
      addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => {
        listeners.add(listener);
      },
      removeEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => {
        listeners.delete(listener);
      },
      dispatchEvent: (event: Event) => {
        for (const listener of listeners) {
          listener(event as MediaQueryListEvent);
        }
        return true;
      },
    }),
  });

  window.__setPreferredColorScheme = (scheme: "light" | "dark") => {
    matches = scheme === "dark";
    const event = {
      matches,
      media: "(prefers-color-scheme: dark)",
    } as MediaQueryListEvent;
    for (const listener of listeners) {
      listener(event);
    }
  };
});
