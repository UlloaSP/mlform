// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { FieldController } from "@/runtime";

const nextFrame = (): Promise<void> =>
  new Promise((resolve) => {
    window.setTimeout(resolve, 0);
  });

const isFocusable = (element: Element): element is HTMLElement =>
  element instanceof HTMLElement &&
  (element.matches("input, select, textarea, button, [tabindex]") ||
    element.getAttribute("role") === "textbox");

const findFocusable = (root: ParentNode): HTMLElement | null => {
  for (const element of root.querySelectorAll("*")) {
    if (isFocusable(element)) {
      return element;
    }

    if (element instanceof HTMLElement && element.shadowRoot) {
      const nested = findFocusable(element.shadowRoot);
      if (nested) {
        return nested;
      }
    }
  }

  return null;
};

export const findFieldFrame = (root: ParentNode, fieldId: string): HTMLElement | null =>
  Array.from(root.querySelectorAll<HTMLElement>("mlf-field-frame")).find(
    (frame) => frame.dataset.fieldId === fieldId,
  ) ?? null;

export const scrollFieldFrameIntoView = async (frame: HTMLElement | null): Promise<boolean> => {
  if (!frame) {
    return false;
  }

  frame.scrollIntoView?.({ behavior: "smooth", block: "center", inline: "nearest" });
  await nextFrame();
  findFocusable(frame.shadowRoot ?? frame)?.focus();
  return true;
};

export const findFirstInvalidField = (fields: readonly FieldController[]): FieldController | null =>
  fields.find((field) => field.state.visible && field.state.errors.length > 0) ?? null;
