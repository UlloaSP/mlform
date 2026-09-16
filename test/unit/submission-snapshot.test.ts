// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { describe, expect, it, vi } from "vite-plus/test";
import { createMlRegistryPack } from "@/builtins";
import { createForm, createSubmissionSnapshot } from "@/runtime";
import { createReportFetchRequest } from "@/schema";

describe("submission snapshot", () => {
  it("creates a submission snapshot without submitting", () => {
    const submit = vi.fn().mockResolvedValue({ raw: {}, reports: [] });
    const form = createForm({
      schema: {
        fields: [
          {
            id: "ui_age",
            kind: "number",
            label: "Age",
            displayKey: "patientAge",
            mappedTo: { default: "age_years", remote: "actual_age" },
          },
          {
            id: "internal_note",
            kind: "text",
            label: "Internal note",
            hidden: true,
            defaultValue: "review",
            mappedTo: "note",
          },
        ],
      },
      registry: createMlRegistryPack().registry,
      transport: { submit },
    });

    form.setValues({ "ui-age": 42 });
    const snapshot = createSubmissionSnapshot(form, {
      backend: "remote",
      inactiveFieldPolicy: "include",
    });

    expect(submit).not.toHaveBeenCalled();
    expect(snapshot.displayValues).toEqual({ patientAge: 42 });
    expect(snapshot.modelValues).toEqual({ actual_age: 42, note: "review" });
    expect(snapshot.inputs.map(({ fieldId, value }) => [fieldId, value])).toEqual([
      ["ui-age", 42],
      ["internal-note", "review"],
    ]);
  });

  it("exposes display and model data without using ids as external keys", async () => {
    const submit = vi.fn().mockResolvedValue({ raw: {}, reports: [] });
    const form = createForm({
      schema: {
        fields: [
          {
            id: "ui_age",
            kind: "number",
            label: "Age",
            displayKey: "patientAge",
            mappedTo: "age_years",
          },
          {
            id: "ui_sex",
            kind: "onehot-category",
            label: "Sex",
            displayKey: "sex",
            options: [
              { label: "Male", value: "M", mappedTo: "sex_m" },
              { label: "Female", value: "F", mappedTo: "sex_f" },
            ],
          },
        ],
      },
      registry: createMlRegistryPack().registry,
      transport: { submit },
    });

    form.setValues({ "ui-age": 42, "ui-sex": "M" });
    const result = await form.submit();

    expect(submit).toHaveBeenCalledWith(
      expect.objectContaining({
        displayValues: { patientAge: 42, sex: "M" },
        modelValues: { age_years: 42, sex_m: 1, sex_f: 0 },
      }),
    );
    expect(result.inputs).toEqual([
      expect.objectContaining({
        fieldId: "ui-age",
        displayKey: "patientAge",
        mappedTo: "age_years",
        modelValues: { age_years: 42 },
      }),
      expect.objectContaining({
        fieldId: "ui-sex",
        displayKey: "sex",
        modelValues: { sex_m: 1, sex_f: 0 },
      }),
    ]);
    expect(result.displayValues).toEqual({ patientAge: 42, sex: "M" });
    expect(result.modelValues).toEqual({ age_years: 42, sex_m: 1, sex_f: 0 });
    for (const alias of ["values", "fieldValues", "serializedValues", "serializedFieldValues"]) {
      expect(result).not.toHaveProperty(alias);
      expect(submit.mock.calls[0]?.[0]).not.toHaveProperty(alias);
    }

    const reportRequest = createReportFetchRequest(result);
    expect(reportRequest).toEqual(
      expect.objectContaining({
        inputs: result.inputs,
        displayValues: result.displayValues,
        modelValues: result.modelValues,
      }),
    );
    for (const alias of ["values", "fieldValues", "serializedValues", "serializedFieldValues"]) {
      expect(reportRequest).not.toHaveProperty(alias);
    }
  });

  it("supports numeric mappedTo targets in display and model snapshots", () => {
    const form = createForm({
      schema: {
        fields: [
          {
            id: "ui_age",
            kind: "number",
            label: "Age",
            displayKey: "patientAge",
            mappedTo: 0,
          },
          {
            id: "ui_color",
            kind: "onehot-category",
            label: "Color",
            displayKey: "color",
            options: [
              { label: "Red", value: "red", mappedTo: 1 },
              { label: "Green", value: "green", mappedTo: 2 },
            ],
          },
        ],
      },
      registry: createMlRegistryPack().registry,
      transport: { submit: vi.fn().mockResolvedValue({ reports: [] }) },
    });

    form.setValues({ "ui-age": 42, "ui-color": "green" });
    const snapshot = createSubmissionSnapshot(form);

    expect(snapshot.displayValues).toEqual({ patientAge: 42, color: "green" });
    expect(snapshot.modelValues).toEqual({ "0": 42, "1": 0, "2": 1 });
    expect(snapshot.inputs).toEqual([
      expect.objectContaining({
        fieldId: "ui-age",
        displayKey: "patientAge",
        mappedTo: 0,
        modelValues: { "0": 42 },
      }),
      expect.objectContaining({
        fieldId: "ui-color",
        displayKey: "color",
        modelValues: { "1": 0, "2": 1 },
      }),
    ]);
  });

  it("emits all mapped targets when backend is omitted", () => {
    const form = createForm({
      schema: {
        fields: [
          {
            id: "ui_age",
            kind: "number",
            label: "Age",
            displayKey: "patientAge",
            mappedTo: { risk: "risk_age", cost: "cost_age" },
          },
          {
            id: "ui_color",
            kind: "onehot-category",
            label: "Color",
            displayKey: "color",
            options: [
              {
                label: "Red",
                value: "red",
                mappedTo: { risk: "risk_red", cost: "cost_red" },
              },
              {
                label: "Green",
                value: "green",
                mappedTo: { risk: "risk_green", cost: "cost_green" },
              },
            ],
          },
        ],
      },
      registry: createMlRegistryPack().registry,
      transport: { submit: vi.fn().mockResolvedValue({ reports: [] }) },
    });

    form.setValues({ "ui-age": 42, "ui-color": "green" });
    const snapshot = createSubmissionSnapshot(form);

    expect(snapshot.displayValues).toEqual({ patientAge: 42, color: "green" });
    expect(snapshot.modelValues).toEqual({
      risk_age: 42,
      cost_age: 42,
      risk_red: 0,
      cost_red: 0,
      risk_green: 1,
      cost_green: 1,
    });
    expect(snapshot.inputs).toEqual([
      expect.objectContaining({
        mappedTo: "risk_age",
        modelValues: { risk_age: 42, cost_age: 42 },
      }),
      expect.objectContaining({
        modelValues: { risk_red: 0, cost_red: 0, risk_green: 1, cost_green: 1 },
      }),
    ]);
  });
});
