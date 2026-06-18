// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { describe, expect, it, vi } from "vite-plus/test";
import { createMlRegistryPack } from "@/builtins";
import { createForm } from "@/runtime";

const registry = createMlRegistryPack().registry;

describe("display key contract", () => {
  it("keeps display keys stable when labels change", async () => {
    const submitA = vi.fn().mockResolvedValue({ reports: {} });
    const formA = createForm({
      schema: {
        fields: [
          {
            id: "age",
            kind: "number",
            label: "Age",
            displayKey: "patientAge",
            mappedTo: "age_years",
          },
        ],
      },
      registry,
      transport: { submit: submitA },
    });
    const submitB = vi.fn().mockResolvedValue({ reports: {} });
    const formB = createForm({
      schema: {
        fields: [
          {
            id: "age",
            kind: "number",
            label: "Patient age shown in review",
            displayKey: "patientAge",
            mappedTo: "age_years",
          },
        ],
      },
      registry,
      transport: { submit: submitB },
    });

    formA.setValues({ age: 42 });
    formB.setValues({ age: 42 });
    const resultA = await formA.submit();
    const resultB = await formB.submit();

    expect(resultA.inputs?.[0]?.label).toBe("Age");
    expect(resultB.inputs?.[0]?.label).toBe("Patient age shown in review");
    expect(resultA.inputs?.[0]?.displayKey).toBe("patientAge");
    expect(resultB.inputs?.[0]?.displayKey).toBe("patientAge");
    expect(resultA.displayValues).toEqual(resultB.displayValues);
    expect(resultA.modelValues).toEqual(resultB.modelValues);
    expect(resultA.serializedValues).toEqual(resultB.serializedValues);
    expect(resultA.displayValues).toEqual({ patientAge: 42 });
    expect(resultA.modelValues).toEqual({ age_years: 42 });
  });

  it("normalizes explicit display keys before using them as display data keys", async () => {
    const form = createForm({
      schema: {
        fields: [
          {
            id: "age",
            kind: "number",
            label: "Age",
            displayKey: " patientAge ",
          },
        ],
      },
      registry,
      transport: { submit: vi.fn().mockResolvedValue({ reports: {} }) },
    });

    form.setValues({ age: 42 });
    const result = await form.submit();

    expect(result.inputs?.[0]?.displayKey).toBe("patientAge");
    expect(result.displayValues).toEqual({ patientAge: 42 });
  });

  it("does not use labels as display data keys when displayKey is missing", async () => {
    const form = createForm({
      schema: {
        fields: [{ id: "age", kind: "number", label: "Age" }],
      },
      registry,
      transport: { submit: vi.fn().mockResolvedValue({ reports: {} }) },
    });

    form.setValues({ age: 42 });
    const result = await form.submit();

    expect(result.inputs?.[0]).toEqual(
      expect.objectContaining({
        fieldId: "age",
        displayKey: undefined,
        label: "Age",
      }),
    );
    expect(result.displayValues).toEqual({});
  });

  it("rejects duplicate display keys before overwriting display data", async () => {
    const form = createForm({
      schema: {
        fields: [
          {
            id: "age",
            kind: "number",
            label: "Age",
            displayKey: "reviewValue",
          },
          {
            id: "score",
            kind: "number",
            label: "Score",
            displayKey: "reviewValue",
          },
        ],
      },
      registry,
      transport: { submit: vi.fn().mockResolvedValue({ reports: {} }) },
    });

    form.setValues({ age: 42, score: 0.9 });

    await expect(form.submit()).rejects.toThrow(/duplicate displayKey "reviewValue"/);
  });
});
