// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { describe, expect, it, vi } from "vite-plus/test";
import { createMlRegistryPack } from "@/builtins";
import { createForm } from "@/runtime";
import { readyReport } from "../report-result";

const registry = createMlRegistryPack().registry;

describe("runtime id boundary", () => {
  it("keeps field ids as runtime handles, not external payload keys", async () => {
    const submitA = vi.fn().mockResolvedValue({ reports: [] });
    const formA = createForm({
      schema: {
        fields: [
          {
            id: "ui_age_a",
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
    const submitB = vi.fn().mockResolvedValue({ reports: [] });
    const formB = createForm({
      schema: {
        fields: [
          {
            id: "ui_age_b",
            kind: "number",
            label: "Age",
            displayKey: "patientAge",
            mappedTo: "age_years",
          },
        ],
      },
      registry,
      transport: { submit: submitB },
    });

    formA.setValues({ "ui-age-a": 42 });
    formB.setValues({ "ui-age-b": 42 });
    const resultA = await formA.submit();
    const resultB = await formB.submit();

    expect(formA.getField("ui-age-a")?.state.value).toBe(42);
    expect(formB.getField("ui-age-b")?.state.value).toBe(42);
    expect(resultA.inputs?.[0]?.fieldId).toBe("ui-age-a");
    expect(resultB.inputs?.[0]?.fieldId).toBe("ui-age-b");
    expect(resultA.inputs[0]?.fieldId).toBe("ui-age-a");
    expect(resultB.inputs[0]?.fieldId).toBe("ui-age-b");
    expect(resultA.displayValues).toEqual(resultB.displayValues);
    expect(resultA.modelValues).toEqual(resultB.modelValues);
    expect(resultA.displayValues).toEqual({ patientAge: 42 });
    expect(resultA.modelValues).toEqual({ age_years: 42 });
    expect(resultA.displayValues).not.toHaveProperty("ui-age-a");
    expect(resultA.modelValues).not.toHaveProperty("ui-age-a");
    expect(resultB.displayValues).not.toHaveProperty("ui-age-b");
    expect(resultB.modelValues).not.toHaveProperty("ui-age-b");
  });

  it("looks up fields by external display and model contracts without id fallback", () => {
    const form = createForm({
      schema: {
        fields: [
          {
            id: "ui_age",
            kind: "number",
            label: "Edited Age Label",
            displayKey: "patientAge",
            mappedTo: { risk: "risk_age", cost: "cost_age" },
          },
          {
            id: "ui_sex",
            kind: "onehot-category",
            label: "Sex",
            displayKey: "sex",
            options: [
              { label: "Male", value: "M", mappedTo: { risk: "risk_m", cost: "cost_m" } },
              { label: "Female", value: "F", mappedTo: { risk: "risk_f", cost: "cost_f" } },
            ],
          },
        ],
      },
      registry,
      transport: { submit: vi.fn().mockResolvedValue({ reports: [] }) },
    });

    expect(form.getField("ui-age")?.config.label).toBe("Edited Age Label");
    expect(form.getFieldByDisplayKey("patientAge")?.id).toBe("ui-age");
    expect(form.getFieldByMappedTo("risk_age", { backend: "risk" })?.id).toBe("ui-age");
    expect(form.getFieldByMappedTo("cost_age", { backend: "cost" })?.id).toBe("ui-age");
    expect(form.getFieldByMappedTo("risk_m", { backend: "risk" })?.id).toBe("ui-sex");
    expect(form.getFieldByDisplayKey("Edited Age Label")).toBeUndefined();
    expect(form.getFieldByMappedTo("ui-age")).toBeUndefined();
  });

  it("keeps report ids as runtime handles, not external output keys", async () => {
    const submitA = vi.fn().mockResolvedValue({
      reports: [readyReport("risk_score", { prediction: "high" })],
    });
    const formA = createForm({
      schema: {
        fields: [{ kind: "text", label: "Name", mappedTo: "name" }],
        reports: [{ id: "ui_risk_a", kind: "classifier", mappedTo: "risk_score" }],
      },
      registry,
      transport: { submit: submitA },
    });
    const submitB = vi.fn().mockResolvedValue({
      reports: [readyReport("risk_score", { prediction: "high" })],
    });
    const formB = createForm({
      schema: {
        fields: [{ kind: "text", label: "Name", mappedTo: "name" }],
        reports: [{ id: "ui_risk_b", kind: "classifier", mappedTo: "risk_score" }],
      },
      registry,
      transport: { submit: submitB },
    });

    formA.setValues({ name: "Alice" });
    formB.setValues({ name: "Alice" });
    const resultA = await formA.submit();
    const resultB = await formB.submit();

    expect(formA.getReport("ui-risk-a")?.state).toMatchObject({
      status: "ready",
      payload: { prediction: "high" },
    });
    expect(formB.getReport("ui-risk-b")?.state).toMatchObject({
      status: "ready",
      payload: { prediction: "high" },
    });
    expect(resultA.reportStates["ui-risk-a"]?.payload).toEqual(
      resultB.reportStates["ui-risk-b"]?.payload,
    );
    expect(resultA.reports).toEqual(resultB.reports);
    expect(resultA.reports).toEqual([readyReport("risk_score", { prediction: "high" })]);
    expect(resultA.reports).not.toHaveProperty("ui-risk-a");
    expect(resultB.reports).not.toHaveProperty("ui-risk-b");
  });
});
