// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { beforeAll } from "vitest";

// Setup DOM environment
beforeAll(() => {
  // Mock DOM APIs if needed
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {
        "";
      },
      removeListener: () => {
        "";
      },
      addEventListener: () => {
        "";
      },
      removeEventListener: () => {
        "";
      },
      dispatchEvent: () => {
        "";
      },
    }),
  });
});
