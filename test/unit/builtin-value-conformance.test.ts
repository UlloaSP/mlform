// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { describe, expect, it } from "vite-plus/test";
import {
  booleanFieldDefinition,
  categoryFieldDefinition,
  dateFieldDefinition,
  longTextFieldDefinition,
  mappedCategoryFieldDefinition,
  multiChoiceFieldDefinition,
  numberFieldDefinition,
  oneHotCategoryFieldDefinition,
  ratingFieldDefinition,
  seriesFieldDefinition,
  singleChoiceFieldDefinition,
  textFieldDefinition,
} from "mlform/builtins";
import type {
  FieldConfig,
  FieldDefinition,
  FieldValidationContext,
  NormalizedFieldConfig,
} from "mlform/schema";

type ValueCase = {
  kind: string;
  definition: FieldDefinition;
  config: Record<string, unknown>;
  input: unknown;
  normalized: unknown;
  serialized?: unknown;
  invalidInput?: unknown;
  invalidMessage?: string;
};

const asDefinition = (definition: unknown): FieldDefinition => definition as FieldDefinition;

const cases: ValueCase[] = [
  {
    kind: "text",
    definition: asDefinition(textFieldDefinition),
    config: { kind: "text", label: "Text" },
    input: 42,
    normalized: "42",
  },
  {
    kind: "number",
    definition: asDefinition(numberFieldDefinition),
    config: { kind: "number", label: "Number", min: 0, max: 10, step: 2 },
    input: "4",
    normalized: 4,
    invalidInput: 3,
    invalidMessage: "Value must be a multiple of 2.",
  },
  {
    kind: "boolean",
    definition: asDefinition(booleanFieldDefinition),
    config: { kind: "boolean", label: "Boolean" },
    input: "false",
    normalized: false,
  },
  {
    kind: "category",
    definition: asDefinition(categoryFieldDefinition),
    config: { kind: "category", label: "Category", options: ["1", "2"] },
    input: 2,
    normalized: "2",
  },
  {
    kind: "mapped-category",
    definition: asDefinition(mappedCategoryFieldDefinition),
    config: {
      kind: "mapped-category",
      label: "Mapped category",
      options: [{ label: "Professional", value: "pro", mapping: { target: true } }],
    },
    input: "pro",
    normalized: "pro",
  },
  {
    kind: "onehot-category",
    definition: asDefinition(oneHotCategoryFieldDefinition),
    config: {
      kind: "onehot-category",
      label: "One hot",
      options: [
        { label: "Yes", value: "yes", mappedTo: "is_yes" },
        { label: "No", value: "no", mappedTo: "is_no" },
      ],
    },
    input: "yes",
    normalized: "yes",
  },
  {
    kind: "date",
    definition: asDefinition(dateFieldDefinition),
    config: { kind: "date", label: "Date" },
    input: "2026-01-02",
    normalized: new Date("2026-01-02T00:00:00.000Z"),
    serialized: "2026-01-02T00:00:00.000Z",
  },
  {
    kind: "series",
    definition: asDefinition(seriesFieldDefinition),
    config: {
      kind: "series",
      label: "Series",
      field1: { kind: "date", label: "Date" },
      field2: { kind: "number", label: "Value" },
    },
    input: [{ field1: "2026-01-02", field2: "4" }],
    normalized: [{ field1: new Date("2026-01-02T00:00:00.000Z"), field2: 4 }],
    serialized: [{ field1: "2026-01-02T00:00:00.000Z", field2: 4 }],
  },
  {
    kind: "long-text",
    definition: asDefinition(longTextFieldDefinition),
    config: { kind: "long-text", label: "Long text", minLength: 2 },
    input: 123,
    normalized: "123",
    invalidInput: "x",
    invalidMessage: "Minimum length is 2 characters.",
  },
  {
    kind: "single-choice",
    definition: asDefinition(singleChoiceFieldDefinition),
    config: { kind: "single-choice", label: "Single choice", options: ["1", "2"] },
    input: 1,
    normalized: "1",
  },
  {
    kind: "multi-choice",
    definition: asDefinition(multiChoiceFieldDefinition),
    config: { kind: "multi-choice", label: "Multi choice", options: ["1", "two"] },
    input: [1, "1", "two", null],
    normalized: ["1", "two"],
  },
  {
    kind: "rating",
    definition: asDefinition(ratingFieldDefinition),
    config: { kind: "rating", label: "Rating", min: 1, max: 5, step: 2 },
    input: "3",
    normalized: 3,
    invalidInput: 4,
    invalidMessage: "Value must follow a step of 2 from 1.",
  },
];

describe("builtin value conformance", () => {
  it.each(cases)("normalizes and serializes $kind through its definition", (testCase) => {
    const config = testCase.definition.schema.parse(testCase.config) as FieldConfig;
    const normalized = testCase.definition.normalizeValue?.(testCase.input, config);
    const serialized = testCase.definition.serializeValue?.(normalized, config) ?? normalized;

    expect(normalized).toEqual(testCase.normalized);
    expect(serialized).toEqual(testCase.serialized ?? testCase.normalized);
  });

  it.each(cases.filter(({ invalidInput }) => invalidInput !== undefined))(
    "rejects values outside the $kind contract",
    (testCase) => {
      const config = testCase.definition.schema.parse(testCase.config) as FieldConfig;
      const value = testCase.definition.normalizeValue?.(testCase.invalidInput, config);
      const context = {
        field: { ...config, id: testCase.kind } as NormalizedFieldConfig,
        values: {},
        submitCount: 0,
        validationVersion: 1,
      } satisfies FieldValidationContext;

      expect(testCase.definition.validateSync?.(value, config, context)).toContain(
        testCase.invalidMessage,
      );
    },
  );
});
