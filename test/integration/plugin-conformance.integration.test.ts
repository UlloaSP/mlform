// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { describe, expect, it, vi } from "vite-plus/test";
import * as z from "zod";
import { mountForm } from "@/kit";
import { defineFieldKind, defineMLFormPlugin, defineReportKind } from "@/view";
import {
  baseFieldConfigSchema,
  baseReportConfigSchema,
  resolveMappedReportPayload,
} from "mlform/schema";
import { flush, getDeclarativeFieldControlHost, getShadow } from "./kit-integration-helpers";
import { readyReport } from "../report-result";

const confidenceField = defineFieldKind({
  kind: "confidence",
  schema: baseFieldConfigSchema.extend({
    kind: z.literal("confidence"),
    min: z.number().default(0),
    max: z.number().default(100),
  }),
  value: {
    default: () => 0,
    normalize: (value) => Number(value ?? 0),
    serialize: (value) => value / 100,
  },
  validateSync: ({ value, config }) =>
    value < config.min || value > config.max ? ["Confidence is out of range."] : [],
  render: {
    widget: "number",
    hints: { input: "range", min: 0, max: 100, step: 1 },
  },
});

const strategyReport = defineReportKind({
  kind: "strategy-summary",
  schema: baseReportConfigSchema.extend({ kind: z.literal("strategy-summary") }),
  resolve: ({ report, result }) => resolveMappedReportPayload(report, result),
  render: {
    content: ({ payload }) => [{ type: "text", value: (payload as { message: string }).message }],
  },
});

const strategyPlugin = defineMLFormPlugin({
  fields: [confidenceField],
  reports: [strategyReport],
  behaviors: [
    {
      beforeSubmitRecords(records) {
        records.modelValues.pluginVersion = "v1";
      },
    },
  ],
});

describe("plugin conformance", () => {
  it("runs an external field, report, and behavior through the complete kit path", async () => {
    const submit = vi.fn().mockResolvedValue({
      reports: [readyReport("strategy_summary", { message: "Strategy settled" }, "primary")],
    });
    const container = document.createElement("div");
    document.body.append(container);
    const mounted = mountForm(container, {
      plugins: [strategyPlugin],
      transport: { submit },
      schema: {
        fields: [
          {
            kind: "confidence",
            label: "Confidence",
            min: 10,
            max: 90,
            mappedTo: { primary: "score" },
          },
        ],
        reports: [
          {
            kind: "strategy-summary",
            label: "Strategy summary",
            mappedTo: { primary: "strategy_summary" },
          },
        ],
      },
    });

    await flush();
    const input = getDeclarativeFieldControlHost(mounted.host, 0) as HTMLInputElement;
    expect(input).toBeInstanceOf(HTMLInputElement);
    expect(input.min).toBe("0");
    expect(input.max).toBe("100");
    expect(input.step).toBe("1");

    input.value = "95";
    input.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
    await expect(mounted.form.submit({ backend: "primary" })).rejects.toMatchObject({
      name: "ValidationError",
    });
    expect(submit).not.toHaveBeenCalled();

    input.value = "75";
    input.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
    const result = await mounted.form.submit({ backend: "primary" });
    await flush();

    expect(submit).toHaveBeenCalledWith(
      expect.objectContaining({
        backend: "primary",
        modelValues: { score: 0.75, pluginVersion: "v1" },
      }),
    );
    expect(result.reportStates).toMatchObject({
      "strategy-summary": { status: "ready", payload: { message: "Strategy settled" } },
    });

    const reportFrame = getShadow(mounted.host).querySelector("mlf-report-frame");
    const reportRenderer = getShadow(reportFrame).querySelector("mlf-declarative-report");
    expect(getShadow(reportRenderer).textContent).toContain("Strategy settled");

    mounted.unmount();
    expect(container.childElementCount).toBe(0);
    container.remove();
  });
});
