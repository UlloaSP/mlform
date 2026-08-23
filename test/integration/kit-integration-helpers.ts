// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

export const flush = async (): Promise<void> => {
  await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));
  await Promise.resolve();
};

export const getShadow = (element: Element | null): ShadowRoot => {
  if (!(element instanceof HTMLElement) || !element.shadowRoot) {
    throw new Error("Expected element with shadow root.");
  }

  return element.shadowRoot;
};

export const reportPayload = (reports: readonly unknown[], id: string): unknown => {
  const item = reports.find(
    (report): report is Record<string, unknown> =>
      typeof report === "object" &&
      report !== null &&
      !Array.isArray(report) &&
      ((report as Record<string, unknown>).id === id ||
        (report as Record<string, unknown>).mappedTo === id),
  );
  return item && "payload" in item ? item.payload : item;
};

export const getFieldControlHost = (host: HTMLElement, index: number): HTMLElement => {
  const fieldFrame = getShadow(host).querySelectorAll("mlf-field-frame").item(index) as HTMLElement;
  const fieldShadow = getShadow(fieldFrame);
  const renderer = fieldShadow.querySelector(
    "mlf-text-field, mlf-number-field, mlf-boolean-field, mlf-category-field, mlf-date-field, mlf-series-field",
  );
  return getShadow(renderer).querySelector("[aria-label]") as HTMLElement;
};

export const getDeclarativeFieldControlHost = (host: HTMLElement, index: number): HTMLElement => {
  const fieldFrame = getShadow(host).querySelectorAll("mlf-field-frame").item(index) as HTMLElement;
  const renderer = getShadow(fieldFrame).querySelector("mlf-declarative-field") as HTMLElement;
  const rendererShadow = getShadow(renderer);
  const builtinRenderer = rendererShadow.querySelector(
    "mlf-text-field, mlf-number-field, mlf-boolean-field, mlf-category-field, mlf-date-field, mlf-series-field",
  ) as HTMLElement;
  return getShadow(builtinRenderer).querySelector("[aria-label]") as HTMLElement;
};
