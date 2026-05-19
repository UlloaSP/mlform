// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { FormViewController, FormViewFieldItem } from "./types";

export type FieldFocusAdapter = (host: HTMLElement, fieldId: string) => Promise<boolean>;

const waitForRender = async (host: HTMLElement): Promise<void> => {
  await Promise.resolve();
  if ("updateComplete" in host) {
    await (host as HTMLElement & { updateComplete: Promise<unknown> }).updateComplete;
  }
  await Promise.resolve();
};

const firstInvalidField = (view: FormViewController): FormViewFieldItem | null => {
  const fields = view
    .getSnapshot()
    .fields.filter((field) => field.state.visible && field.state.errors.length > 0);
  const order = new Map(
    view.getLayoutReferences().fields.map((fieldId, index) => [fieldId, index]),
  );
  fields.sort((left, right) => (order.get(left.id) ?? 0) - (order.get(right.id) ?? 0));
  return fields[0] ?? null;
};

export const revealFirstInvalidField = async (
  host: HTMLElement,
  view: FormViewController,
  focusField: FieldFocusAdapter,
): Promise<boolean> => {
  const field = firstInvalidField(view);
  if (!field) {
    return false;
  }

  const layoutKind = view.getSnapshot().layout.kind;

  if (layoutKind === "wizard" && field.stepId) {
    await view.goToStep(field.stepId);
  }

  if (layoutKind === "tabs" && field.tabId) {
    view.setActiveTab(field.tabId);
  }

  if (field.sectionId) {
    view.openSection(field.sectionId);
  }

  await waitForRender(host);
  return focusField(host, field.id);
};
