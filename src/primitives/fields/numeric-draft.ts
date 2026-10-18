// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { toText } from "../utils";

/** Keep an editor's spelling until the committed value is replaced externally. */
export class NumericDraft {
  #text: string | undefined;
  #committed: unknown;

  record(text: string, committed: unknown): void {
    this.#text = text;
    this.#committed = committed;
  }

  display(value: unknown): string {
    if (this.#text !== undefined && Object.is(value, this.#committed)) return this.#text;
    this.#text = undefined;
    return toText(value);
  }
}

/** Delegate spinbutton arithmetic and bounds to the browser's number control. */
export const stepNumericDraft = (event: KeyboardEvent, value: unknown): void => {
  if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
  const input = event.currentTarget as HTMLInputElement;
  if (input.disabled || input.readOnly) return;
  event.preventDefault();
  const stepper = input.ownerDocument.createElement("input");
  stepper.type = "number";
  stepper.min = input.min;
  stepper.max = input.max;
  stepper.step = input.step || "1";
  stepper.value = typeof value === "number" ? String(value) : "";
  if (event.key === "ArrowUp") stepper.stepUp();
  else stepper.stepDown();
  input.value = stepper.value;
  input.dispatchEvent(new Event("input", { bubbles: true }));
};
