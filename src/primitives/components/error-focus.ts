// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { PrimitiveFieldController } from "../controller-types";

const nextFrame = (): Promise<void> =>
  new Promise((resolve) => {
    globalThis.setTimeout(resolve, 0);
  });

const isHTMLElement = (element: Element): element is HTMLElement => {
  const Constructor = (element.ownerDocument.defaultView as (Window & typeof globalThis) | null)
    ?.HTMLElement;
  return Boolean(Constructor && element instanceof Constructor);
};

const isFocusable = (element: Element): element is HTMLElement =>
  isHTMLElement(element) &&
  (element.matches("input, select, textarea, button, [tabindex]") ||
    element.getAttribute("role") === "textbox");

const findFocusable = (root: ParentNode): HTMLElement | null => {
  for (const element of root.querySelectorAll("*")) {
    if (isFocusable(element)) {
      return element;
    }

    if (isHTMLElement(element) && element.shadowRoot) {
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
  const controlRoot = frame.shadowRoot?.querySelector(".control-slot") ?? frame.shadowRoot ?? frame;
  findFocusable(controlRoot)?.focus();
  return true;
};

export const focusPrimitiveField = async (host: HTMLElement, fieldId: string): Promise<boolean> =>
  scrollFieldFrameIntoView(findFieldFrame(host.shadowRoot ?? host, fieldId));

export const findFirstInvalidField = (
  fields: readonly PrimitiveFieldController[],
): PrimitiveFieldController | null =>
  fields.find((field) => field.state.visible && field.state.errors.length > 0) ?? null;
