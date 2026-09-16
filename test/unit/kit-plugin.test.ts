// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import * as z from "zod";
import { describe, expect, it, vi } from "vite-plus/test";
import {
  createFormView,
  defineFieldKind,
  defineMLFormPlugin,
  defineReportKind,
  mountForm,
} from "@/kit";

const scoreField = defineFieldKind({
  kind: "score",
  schema: z.object({
    kind: z.literal("score"),
    label: z.string(),
    defaultValue: z.number().optional(),
  }),
  value: {
    default: (config) => config.defaultValue ?? 0,
    normalize: (value) => (typeof value === "number" ? value : 0),
  },
  render: {
    widget: "number",
    hints: { min: 0, max: 100 },
  },
});

const scoreReport = defineReportKind({
  kind: "score-summary",
  schema: z.object({
    kind: z.literal("score-summary"),
    label: z.string().optional(),
  }),
  render: {
    content: () => [{ type: "text", value: "Score summary" }],
  },
});

describe("MLForm plugins", () => {
  it("composes built-in and plugin kinds through one kit option", () => {
    const plugin = defineMLFormPlugin({ fields: [scoreField], reports: [scoreReport] });
    const view = createFormView({
      schema: {
        fields: [
          { id: "name", kind: "text", label: "Name" },
          { id: "confidence", kind: "score", label: "Confidence", defaultValue: 75 },
        ],
        reports: [{ id: "summary", kind: "score-summary" }],
      },
      transport: { submit: vi.fn().mockResolvedValue({ reports: [] }) },
      plugins: [plugin],
    });

    expect(view.getField("name")?.kind).toBe("text");
    expect(view.getField("confidence")).toMatchObject({
      kind: "score",
      state: { value: 75 },
      descriptor: {
        component: "declarative-field",
        props: { widget: "number", min: 0, max: 100 },
      },
    });
    expect(view.engineRegistry.getReport("score-summary")).toBe(scoreReport.definition);
    expect(view.descriptorRegistry.getReport("score-summary")).toBe(scoreReport.presenter);
  });

  it("keeps field and report plugin entries distinct at compile time", () => {
    defineMLFormPlugin({
      // @ts-expect-error Report kinds cannot be registered as fields.
      fields: [scoreReport],
    });
    defineMLFormPlugin({
      // @ts-expect-error Field kinds cannot be registered as reports.
      reports: [scoreField],
    });
  });

  it("applies plugin behaviors through mountForm", async () => {
    let validations = 0;
    const plugin = defineMLFormPlugin({
      fields: [scoreField],
      behaviors: [{ validate: () => void (validations += 1) }],
    });
    const container = document.createElement("div");
    const mounted = mountForm(container, {
      schema: {
        fields: [
          { id: "name", kind: "text", label: "Name" },
          { id: "confidence", kind: "score", label: "Confidence" },
        ],
      },
      transport: { submit: vi.fn().mockResolvedValue({ reports: [] }) },
      plugins: [plugin],
    });

    await mounted.form.validate();

    expect(validations).toBeGreaterThan(0);
    expect(mounted.engineRegistry.getField("text")).toBeDefined();
    expect(mounted.engineRegistry.getField("score")).toBeDefined();
    expect(container.firstElementChild).toBe(mounted.host);

    mounted.unmount();
    expect(container.childElementCount).toBe(0);
  });

  it("rejects duplicate plugin registrations", () => {
    const plugin = defineMLFormPlugin({ fields: [scoreField] });

    expect(() =>
      createFormView({
        schema: { fields: [{ kind: "score", label: "Score" }] },
        transport: { submit: vi.fn().mockResolvedValue({ reports: [] }) },
        plugins: [plugin, plugin],
      }),
    ).toThrow('Field kind "score" is already registered.');
  });
});
