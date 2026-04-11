// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { PrimitiveRegistry } from "./types";
import { primitiveTagNames } from "./constants";

const reservedCustomElementNames = new Set([
  "annotation-xml",
  "color-profile",
  "font-face",
  "font-face-src",
  "font-face-uri",
  "font-face-format",
  "font-face-name",
  "missing-glyph",
]);

const isValidCustomElementName = (tagName: string): boolean => {
  return (
    /^[a-z][-.0-9_a-z]*-[-.0-9_a-z]*[a-z0-9]$/.test(tagName) &&
    !reservedCustomElementNames.has(tagName)
  );
};

const assertTagName = (tagName: string): void => {
  if (!isValidCustomElementName(tagName)) {
    throw new TypeError(
      `Invalid primitive renderer tag name "${tagName}". Expected a valid custom element name.`,
    );
  }
};

class EnginePrimitiveRegistry implements PrimitiveRegistry {
  readonly #fields = new Map<string, string>();
  readonly #reports = new Map<string, string>();

  registerField(component: string, tagName: string): PrimitiveRegistry {
    assertTagName(tagName);
    this.#fields.set(component, tagName);
    return this;
  }

  registerReport(component: string, tagName: string): PrimitiveRegistry {
    assertTagName(tagName);
    this.#reports.set(component, tagName);
    return this;
  }

  resolveField(component: string): string | undefined {
    return this.#fields.get(component);
  }

  resolveReport(component: string): string | undefined {
    return this.#reports.get(component);
  }

  clone(): PrimitiveRegistry {
    const next = new EnginePrimitiveRegistry();

    for (const [component, tagName] of this.#fields) {
      next.registerField(component, tagName);
    }

    for (const [component, tagName] of this.#reports) {
      next.registerReport(component, tagName);
    }

    return next;
  }
}

export const createPrimitiveRegistry = (): PrimitiveRegistry => {
  return new EnginePrimitiveRegistry();
};

export const createBuiltinPrimitiveRegistry = (): PrimitiveRegistry => {
  return createPrimitiveRegistry()
    .registerField("text-field", primitiveTagNames.textField)
    .registerField("number-field", primitiveTagNames.numberField)
    .registerField("boolean-field", primitiveTagNames.booleanField)
    .registerField("category-field", primitiveTagNames.categoryField)
    .registerField("date-field", primitiveTagNames.dateField)
    .registerField("time-series-field", primitiveTagNames.timeSeriesField)
    .registerReport("classifier-report", primitiveTagNames.classifierReport)
    .registerReport("regressor-report", primitiveTagNames.regressorReport);
};
