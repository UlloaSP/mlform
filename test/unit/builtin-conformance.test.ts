// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { describe, expect, it } from "vite-plus/test";
import {
  builtinFieldDefinitions,
  builtinFieldKinds,
  builtinReportDefinitions,
  builtinReportKinds,
  createBuiltinMlRegistry,
} from "mlform/builtins";
import { createBuiltinDescriptorRegistry } from "@/view";
import { createBuiltinPrimitiveRegistry } from "mlform/primitives";

const fieldRenderers = {
  text: "text-field",
  number: "number-field",
  boolean: "boolean-field",
  category: "category-field",
  "mapped-category": "category-field",
  "onehot-category": "category-field",
  date: "date-field",
  series: "series-field",
  "long-text": "long-text-field",
  "single-choice": "single-choice-field",
  "multi-choice": "multi-choice-field",
  rating: "rating-field",
} as const;

const reportRenderers = {
  classifier: "classifier-report",
  regressor: "regressor-report",
} as const;

const fieldExamples: Record<
  keyof typeof fieldRenderers,
  { config: Record<string, unknown>; value: unknown }
> = {
  text: { config: {}, value: "text" },
  number: { config: {}, value: 1 },
  boolean: { config: {}, value: true },
  category: { config: { options: ["one"] }, value: "one" },
  "mapped-category": { config: { options: [] }, value: null },
  "onehot-category": { config: { options: [] }, value: null },
  date: { config: {}, value: null },
  series: {
    config: {
      field1: { kind: "date", label: "Date" },
      field2: { kind: "number", label: "Value" },
    },
    value: [],
  },
  "long-text": { config: {}, value: "text" },
  "single-choice": { config: { options: ["one"] }, value: "one" },
  "multi-choice": { config: { options: ["one"] }, value: ["one"] },
  rating: { config: { max: 5 }, value: 3 },
};

describe("builtin conformance inventory", () => {
  it("keeps every field on the definition, descriptor, and primitive path", () => {
    const definitions = createBuiltinMlRegistry();
    const descriptors = createBuiltinDescriptorRegistry();
    const primitives = createBuiltinPrimitiveRegistry();
    const declaredKinds = Object.values(builtinFieldKinds);

    expect(declaredKinds).toEqual(Object.keys(fieldRenderers));
    expect(builtinFieldDefinitions.map(({ kind }) => kind)).toEqual(declaredKinds);

    for (const [kind, renderer] of Object.entries(fieldRenderers)) {
      const example = fieldExamples[kind as keyof typeof fieldRenderers];
      const descriptor = descriptors.getField(kind)?.describe(
        { kind, id: kind, label: kind, ...example.config },
        {
          fieldId: kind,
          value: example.value,
          state: { value: example.value, errors: [], status: "valid" },
        },
      );

      expect(definitions.getField(kind)?.kind).toBe(kind);
      expect(descriptor?.component).toBe(renderer);
      expect(primitives.resolveField(descriptor?.component ?? "")).toBe(`mlf-${renderer}`);
    }
  });

  it("keeps every report on the definition, descriptor, and primitive path", () => {
    const definitions = createBuiltinMlRegistry();
    const descriptors = createBuiltinDescriptorRegistry();
    const primitives = createBuiltinPrimitiveRegistry();
    const declaredKinds = Object.values(builtinReportKinds);

    expect(declaredKinds).toEqual(Object.keys(reportRenderers));
    expect(builtinReportDefinitions.map(({ kind }) => kind)).toEqual(declaredKinds);

    for (const [kind, renderer] of Object.entries(reportRenderers)) {
      const descriptor = descriptors.getReport(kind)?.describe(
        { kind, id: kind, label: kind },
        {
          reportId: kind,
          payload: { value: 1 },
          result: null,
          state: { status: "ready", error: null, payload: { value: 1 } },
        },
      );

      expect(definitions.getReport(kind)?.kind).toBe(kind);
      expect(descriptor?.component).toBe(renderer);
      expect(primitives.resolveReport(descriptor?.component ?? "")).toBe(`mlf-${renderer}`);
    }
  });
});
