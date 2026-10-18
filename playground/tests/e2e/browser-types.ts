import type { FormController, FieldController } from "mlform/runtime";
import type { FormViewController } from "mlform/view";

export interface KitHost extends HTMLElement {
  view: FormViewController;
  form: FormController;
}

export interface FieldFrame extends HTMLElement {
  controller: FieldController;
}

declare global {
  interface Window {
    materialInputBefore: Element;
    speedFrameBefore: Element | null;
    auditAnimations: {
      element: Element;
      animation: Animation;
      frames: PropertyIndexedKeyframes;
      options: KeyframeAnimationOptions;
    }[];
  }
}
