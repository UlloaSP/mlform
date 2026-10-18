// Viewport previews remount in another document; transfer values and editor spelling.
import type { PrimitiveFieldController } from "mlform/primitives";
import type { DemoHandle, DemoState } from "./demo-types.ts";

type FieldFrame = HTMLElement & { controller: PrimitiveFieldController };
const isFrame = (element: Element): element is FieldFrame =>
  element.localName === "mlf-field-frame";
const isNumericInput = (element: Element): element is HTMLInputElement =>
  element.localName === "input" &&
  element.getAttribute("type") === "text" &&
  element.getAttribute("inputmode") === "decimal";

const descendants = (root: ParentNode | null): Element[] =>
  [...(root?.querySelectorAll("*") ?? [])].flatMap((element) =>
    element.shadowRoot ? [element, ...descendants(element.shadowRoot)] : [element],
  );

const settle = async (root: ParentNode): Promise<void> => {
  for (const element of root.children ?? []) {
    if ("updateComplete" in element) await element.updateComplete;
    if (element.shadowRoot) await settle(element.shadowRoot);
    await settle(element);
  }
};

const forms = (mounted: DemoHandle | null) =>
  mounted?.forms ?? (mounted?.form ? [mounted.form] : []);

export const captureDemoState = (mounted: DemoHandle | null, root: HTMLElement) => ({
  forms: forms(mounted).map((form) => form.createSnapshot()),
  presentation: mounted?.capturePresentationState?.(),
  details: [...root.querySelectorAll("details")].map((element) => element.open),
  drafts: descendants(root)
    .filter(isFrame)
    .map((frame) => ({
      fieldId: frame.controller.id,
      values: descendants(frame.shadowRoot)
        .filter(isNumericInput)
        .map((input) => input.value),
    })),
});

export const restoreDemoState = async (
  mounted: DemoHandle | null,
  root: HTMLElement,
  saved: DemoState | null | undefined,
) => {
  if (!saved) return;
  const state: DemoState = JSON.parse(JSON.stringify(saved));
  root.querySelectorAll("details").forEach((element, index) => {
    element.open = state.details[index] ?? element.open;
    element.dispatchEvent(new Event("toggle"));
  });
  forms(mounted).forEach((form, index) => {
    if (state.forms[index]) form.restoreSnapshot(state.forms[index]);
  });
  mounted?.restorePresentationState?.(state.presentation);
  await settle(root);
  if (!root.isConnected) return;
  const frames = descendants(root).filter(isFrame);
  for (const [index, frame] of frames.entries()) {
    const draft = state.drafts[index];
    if (draft?.fieldId !== frame.controller.id) continue;
    const inputs = descendants(frame.shadowRoot).filter(isNumericInput);
    for (const [cell, input] of inputs.entries()) {
      if (draft.values[cell] === undefined || input.value === draft.values[cell]) continue;
      input.value = draft.values[cell];
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }
  }
  await settle(root);
};
