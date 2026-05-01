// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

export interface PanelState {
  kind: "wizard-step" | "tab" | "accordion-section";
  index: number;
  count: number;
  currentId: string;
  canGoNext: boolean;
  canGoPrev: boolean;
}

export const createIndexedPanelState = (
  kind: PanelState["kind"],
  index: number,
  ids: readonly string[],
): PanelState | null => {
  if (ids.length === 0) {
    return null;
  }

  const safeIndex = Math.min(Math.max(index, 0), ids.length - 1);
  return {
    kind,
    index: safeIndex,
    count: ids.length,
    currentId: ids[safeIndex] ?? ids[0]!,
    canGoNext: safeIndex < ids.length - 1,
    canGoPrev: safeIndex > 0,
  };
};
