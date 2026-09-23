// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { FormController } from "@/runtime";

export const bindDocumentLifecycle = (
  form: FormController,
  ownerDocument: Document,
): (() => void) => {
  const ownerWindow = ownerDocument.defaultView;
  const syncVisibility = (): void => {
    if (ownerDocument.visibilityState === "hidden") {
      form.suspend("document-hidden");
    } else {
      form.resume();
    }
  };
  const suspendForPageHide = (): void => form.suspend("page-hidden");

  ownerDocument.addEventListener("visibilitychange", syncVisibility);
  ownerWindow?.addEventListener("pagehide", suspendForPageHide);
  ownerWindow?.addEventListener("pageshow", syncVisibility);
  const disconnect = (): void => {
    ownerDocument.removeEventListener("visibilitychange", syncVisibility);
    ownerWindow?.removeEventListener("pagehide", suspendForPageHide);
    ownerWindow?.removeEventListener("pageshow", syncVisibility);
  };
  try {
    syncVisibility();
  } catch (error) {
    disconnect();
    throw error;
  }
  return disconnect;
};
