// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { describe, expect, it, vi } from "vite-plus/test";
import { readyReport } from "../report-result";
import * as z from "zod";
import { createMlRegistryPack } from "@/builtins";
import {
  defineFieldKind,
  defineReportKind,
  mountForm,
  registerDefinedFieldKind,
  registerDefinedReportKind,
} from "@/kit";
import { resolveMappedReportPayload } from "@/schema";
import {
  flush,
  getDeclarativeFieldControlHost,
  getShadow,
  reportPayload,
} from "./kit-integration-helpers";

describe("kit integration", () => {
  it("mounts fetch-backed reports, renders report frames only after submit, and triggers fetch after submit", async () => {
    const fetchResult = { feature_importance: { name: 0.9 } };
    const transportSubmit = vi.fn().mockResolvedValue(fetchResult);
    const pack = createMlRegistryPack();

    registerDefinedReportKind(
      pack.registry,
      pack.descriptorRegistry,
      defineReportKind({
        kind: "shap",
        schema: z.object({
          kind: z.literal("shap"),
          id: z.string().optional(),
          label: z.string().optional(),
        }),
        fetch: () => ({ submit: transportSubmit }),
        resolve: ({ result }) => reportPayload(result.reports, "shap"),
        render: {
          content: ({ payload }) => [
            {
              type: "json",
              label: "SHAP",
              value: payload,
            },
          ],
        },
      }),
    );

    const container = document.createElement("div");
    document.body.append(container);

    const mounted = mountForm(container, {
      registry: pack.registry,
      descriptorRegistry: pack.descriptorRegistry,
      transport: {
        submit: vi.fn().mockResolvedValue({
          reports: [
            readyReport("risk", {
              prediction: "high",
              labels: ["low", "high"],
              probabilities: [0.2, 0.8],
            }),
          ],
        }),
      },
      schema: {
        fields: [{ kind: "text", label: "Name", required: true, mappedTo: "name" }],
        reports: [
          { kind: "classifier", id: "risk", label: "Risk", mappedTo: "risk" },
          { kind: "shap", label: "SHAP Values" },
        ],
      },
      initialValues: { name: "Alice" },
    });

    await flush();

    expect(mounted.form.reports).toHaveLength(2);
    expect(mounted.form.getReport("shap-values")?.state.status).toBe("idle");
    expect(mounted.form.state.reportStates["shap-values"]?.status).toBe("idle");
    expect(getShadow(mounted.host).querySelector("mlf-report-frame")).toBeNull();

    await mounted.form.submit();
    await flush();
    await flush();
    await flush();

    expect(transportSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        reportId: "shap-values",
        values: { name: "Alice" },
        reports: expect.arrayContaining([expect.objectContaining({ mappedTo: "risk" })]),
      }),
    );

    expect(mounted.form.getReport("shap-values")?.state.status).toBe("ready");
    expect(mounted.form.getReport("shap-values")?.state.payload).toEqual(fetchResult);
    expect(mounted.form.state.reportStates["shap-values"]?.status).toBe("ready");

    const shadow = getShadow(mounted.host);
    expect(shadow.querySelector("mlf-report-frame")).not.toBeNull();

    mounted.unmount();
    container.remove();
  });

  it("supports unregisterReport on the engine registry", () => {
    const registry = createMlRegistryPack().registry;

    const def = {
      kind: "shap",
      schema: z.object({ kind: z.literal("shap"), id: z.string().optional() }).passthrough(),
      resolvePayload: (_config: unknown, context: { result: { reports: readonly unknown[] } }) =>
        reportPayload(context.result.reports, "shap"),
      describe: () => null,
    };

    registry.registerReport(def);
    expect(registry.getReport("shap")).toBeDefined();

    registry.unregisterReport("shap");
    expect(registry.getReport("shap")).toBeUndefined();

    // Re-registration after unregister must not throw.
    expect(() => registry.registerReport(def)).not.toThrow();
    expect(registry.getReport("shap")).toBeDefined();
  });

  it("mounts declarative custom fields and fetch-backed reports without primitive registry wiring", async () => {
    const reportFetch = vi.fn().mockResolvedValue({
      top_features: [
        { feature: "income", score: 0.82 },
        { feature: "savings", score: 0.31 },
      ],
    });
    const pack = createMlRegistryPack();

    registerDefinedFieldKind(
      pack.registry,
      pack.descriptorRegistry,
      defineFieldKind({
        kind: "score",
        schema: z.object({
          kind: z.literal("score"),
          id: z.string().optional(),
          label: z.string(),
          mappedTo: z.union([z.string(), z.number()]).optional(),
          min: z.number().default(0),
          max: z.number().default(100),
          step: z.number().optional(),
          ui: z.record(z.string(), z.unknown()).optional(),
        }),
        value: {
          default: () => 0,
          normalize: (value) => Number(value ?? 0),
          serialize: (value) => value,
        },
        validate: ({ value, config }) =>
          value < config.min || value > config.max ? ["Score out of range."] : [],
        render: {
          widget: "number",
          hints: ({ config }) => ({
            min: config.min,
            max: config.max,
            step: config.step ?? 1,
            unit: "%",
            placeholder: "Enter score",
          }),
        },
      }),
    );

    registerDefinedReportKind(
      pack.registry,
      pack.descriptorRegistry,
      defineReportKind({
        kind: "risk-summary",
        schema: z.object({
          kind: z.literal("risk-summary"),
          id: z.string().optional(),
          label: z.string().optional(),
          mappedTo: z.union([z.string(), z.number()]).optional(),
        }),
        resolve: ({ report, result }) => resolveMappedReportPayload(report, result),
        render: {
          summary: ({ payload }) => ({
            title: "Risk summary",
            value: (payload as { score: number }).score,
            tone: (payload as { score: number }).score > 0.8 ? "danger" : "neutral",
          }),
          content: ({ payload }) => [
            {
              type: "metric",
              label: "Score",
              value: (payload as { score: number }).score,
            },
            {
              type: "list",
              label: "Drivers",
              items: (payload as { drivers: string[] }).drivers,
            },
          ],
        },
      }),
    );

    registerDefinedReportKind(
      pack.registry,
      pack.descriptorRegistry,
      defineReportKind({
        kind: "shap",
        schema: z.object({
          kind: z.literal("shap"),
          id: z.string().optional(),
          label: z.string().optional(),
        }),
        fetch: () => ({ submit: reportFetch }),
        resolve: ({ result }) => reportPayload(result.reports, "shap"),
        render: {
          summary: ({ state }) => ({
            title: "SHAP",
            tone: state.status === "error" ? "danger" : "neutral",
          }),
          content: ({ payload }) => ({
            type: "table",
            label: "Feature impact",
            columns: ["feature", "score"],
            rows: ((payload as { top_features: Array<Record<string, unknown>> }).top_features ??
              []) as Array<Record<string, unknown>>,
          }),
        },
      }),
    );

    const container = document.createElement("div");
    document.body.append(container);

    const mounted = mountForm(container, {
      registry: pack.registry,
      descriptorRegistry: pack.descriptorRegistry,
      transport: {
        submit: vi.fn().mockResolvedValue({
          reports: [readyReport("risk", { score: 0.91, drivers: ["income", "savings"] })],
        }),
      },
      schema: {
        fields: [{ kind: "score", label: "Score", min: 0, max: 100, step: 5, mappedTo: "score" }],
        reports: [
          { kind: "risk-summary", id: "risk", label: "Risk", mappedTo: "risk" },
          { kind: "shap", label: "SHAP Values" },
        ],
      },
      initialValues: { score: 85 },
    });

    await flush();

    const scoreInput = getDeclarativeFieldControlHost(mounted.host, 0) as HTMLInputElement;
    expect(scoreInput.getAttribute("aria-label")).toContain("Score");
    expect(mounted.form.getField("score")?.state.value).toBe(85);

    await mounted.form.submit();
    await flush();
    await flush();
    await flush();

    expect(reportFetch).toHaveBeenCalledWith(
      expect.objectContaining({
        reportId: "shap-values",
        values: { score: 85 },
      }),
    );

    const reportFrames = getShadow(mounted.host).querySelectorAll("mlf-report-frame");
    const riskRenderer = getShadow(reportFrames.item(0)).querySelector(
      "mlf-declarative-report",
    ) as HTMLElement;
    expect(getShadow(riskRenderer).textContent).toContain("Risk summary");
    expect(getShadow(riskRenderer).textContent).toContain("income");

    const shapRenderer = getShadow(reportFrames.item(1)).querySelector(
      "mlf-declarative-report",
    ) as HTMLElement;
    expect(getShadow(shapRenderer).textContent).toContain("Feature impact");
    expect(getShadow(shapRenderer).textContent).toContain("income");

    mounted.unmount();
    container.remove();
  });
});
