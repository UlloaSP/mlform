// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { PrimitiveContainerStrategy } from "@/primitives";

export const captureHostContent = (
  container: HTMLElement,
  strategy: PrimitiveContainerStrategy | undefined,
  previousHost?: HTMLElement,
  previousContent: readonly Node[] = [],
): Node[] => {
  const currentContent = Array.from(container.childNodes).filter((node) => node !== previousHost);
  if (currentContent.length > 0 && strategy !== "replace") {
    throw new TypeError('Mount into an empty container or pass `containerStrategy: "replace"`.');
  }
  return [...previousContent, ...currentContent];
};

export const restoreHostContent = (
  container: HTMLElement,
  originalContent: readonly Node[],
): void => {
  if (container.childNodes.length === 0 && originalContent.length > 0) {
    container.replaceChildren(...originalContent);
  }
};
