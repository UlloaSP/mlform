// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { describe, expect, it, vi } from "vite-plus/test";
import * as z from "zod";
import { createMlRegistryPack } from "@/builtins";
import {
  createForm,
  createMultiBackendSubmissionSnapshot,
  executeMultiBackendPipeline,
} from "@/runtime";

const probeReportSchema = z.object({
  kind: z.literal("probe"),
  id: z.string().optional(),
  label: z.string().optional(),
  mappedTo: z
    .record(z.string(), z.union([z.string(), z.number()]).nullish())
    .or(z.string())
    .optional(),
});

const createProbePack = (fetchReport = vi.fn()) => {
  const pack = createMlRegistryPack();
  pack.registry.registerReport({
    kind: "probe",
    schema: probeReportSchema,
    fetch: () => ({ submit: fetchReport }),
  });
  return pack;
};

describe("multi-backend runtime pipeline", () => {
  it("creates per-backend snapshots for fields mapped to different model keys", () => {
    const form = createForm({
      registry: createMlRegistryPack().registry,
      transport: { submit: vi.fn() },
      schema: {
        fields: [
          {
            kind: "number",
            id: "age",
            label: "Age",
            displayKey: "age",
            mappedTo: { risk: "risk_age", cost: "cost_age" },
          },
          {
            kind: "onehot-category",
            id: "sex",
            label: "Sex",
            displayKey: "sex",
            options: [
              { label: "Male", value: "M", mappedTo: { risk: "risk_m", cost: "cost_m" } },
              { label: "Female", value: "F", mappedTo: { risk: "risk_f", cost: "cost_f" } },
            ],
          },
        ],
      },
      initialValues: { age: 42, sex: "M" },
    });

    const snapshots = createMultiBackendSubmissionSnapshot(form, {
      backends: ["risk", "cost"],
    });

    expect(snapshots.risk.displayValues).toEqual({ age: 42, sex: "M" });
    expect(snapshots.risk.modelValues).toEqual({ risk_age: 42, risk_m: 1, risk_f: 0 });
    expect(snapshots.cost.displayValues).toEqual({ age: 42, sex: "M" });
    expect(snapshots.cost.modelValues).toEqual({ cost_age: 42, cost_m: 1, cost_f: 0 });
  });

  it("returns per-backend success, failure, snapshots, and report contexts", async () => {
    const fetchReport = vi.fn(async (request) => {
      const context = (request as { reportContext?: { backend?: string; targetKey?: string } })
        .reportContext;
      return {
        backend: context?.backend,
        target: context?.targetKey,
        modelValues: (request as { modelValues?: Record<string, unknown> }).modelValues,
      };
    });
    const pack = createProbePack(fetchReport);
    const submit = vi.fn(async (request) => {
      const backend = (request as { backend?: string }).backend;
      if (backend === "bad") {
        throw new Error("bad backend");
      }
      return { reports: {}, meta: { modelId: backend } };
    });
    const form = createForm({
      registry: pack.registry,
      transport: { submit },
      schema: {
        fields: [
          {
            kind: "number",
            id: "age",
            label: "Age",
            mappedTo: { good: "good_age", bad: "bad_age" },
          },
        ],
        reports: [
          {
            kind: "probe",
            id: "risk-tree",
            label: "Risk tree",
            mappedTo: { good: "good_tree", bad: "bad_tree" },
          },
        ],
      },
      initialValues: { age: 42 },
    });

    const result = await executeMultiBackendPipeline({
      form,
      backends: ["good", "bad"],
      reportFetchMode: "all",
    });

    expect(result.runs.good.submitResult?.modelValues).toEqual({ good_age: 42 });
    expect(result.runs.good.submitResult?.reportContexts?.["risk-tree"]).toEqual(
      expect.objectContaining({
        backend: "good",
        targetKey: "good_tree",
        modelValues: { good_age: 42 },
      }),
    );
    expect(result.runs.good.reportFetchResults).toEqual({
      "risk-tree": {
        backend: "good",
        target: "good_tree",
        modelValues: { good_age: 42 },
      },
    });
    expect(result.runs.good.skippedReportIds).toEqual([]);

    expect(result.runs.bad.snapshot.modelValues).toEqual({ bad_age: 42 });
    expect(result.runs.bad.submitResult).toBeUndefined();
    expect(result.runs.bad.error).toBeInstanceOf(Error);
    expect(result.runs.bad.skippedReportIds).toEqual(["risk-tree"]);
    expect(fetchReport).toHaveBeenCalledTimes(1);
  });
});
