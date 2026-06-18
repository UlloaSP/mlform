// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { describe, expect, it, vi } from "vite-plus/test";
import * as z from "zod";
import { createMlRegistryPack } from "@/builtins";
import { createForm, executeFormPipeline } from "@/runtime";
import { createReportFetchRequest, getReportContext } from "@/schema";

const reportSchema = z.object({
  kind: z.literal("probe"),
  id: z.string().optional(),
  label: z.string().optional(),
  mappedTo: z
    .union([
      z.string(),
      z.number(),
      z.record(z.string(), z.union([z.string(), z.number()]).nullish()),
    ])
    .optional(),
});

const createPack = (fetchReport?: (request: unknown) => Promise<unknown>) => {
  const pack = createMlRegistryPack();
  pack.registry.registerReport({
    kind: "probe",
    schema: reportSchema,
    fetch: fetchReport ? () => ({ submit: fetchReport }) : undefined,
  });
  return pack;
};

describe("report context", () => {
  it("exposes report contexts on submit results and fetch requests", async () => {
    const pack = createPack();
    const form = createForm({
      registry: pack.registry,
      transport: {
        submit: vi.fn().mockResolvedValue({
          reports: { summary_score: { score: 0.8 } },
          meta: { modelId: "remote-risk" },
        }),
      },
      schema: {
        fields: [{ kind: "text", id: "name", label: "Name", mappedTo: "patient_name" }],
        reports: [
          {
            kind: "probe",
            id: "ui-summary",
            label: "Risk summary",
            mappedTo: { default: "summary", remote: "summary_score" },
          },
        ],
      },
      initialValues: { name: "Alice" },
    });

    const result = await form.submit({ backend: "remote" });

    expect(result.reportContexts?.["ui-summary"]).toEqual(
      expect.objectContaining({
        reportId: "ui-summary",
        kind: "probe",
        label: "Risk summary",
        target: "summary_score",
        targetKey: "summary_score",
        backend: "remote",
        modelValues: { patient_name: "Alice" },
        meta: { modelId: "remote-risk" },
      }),
    );
    expect(getReportContext(result, "ui-summary")?.targetKey).toBe("summary_score");
    expect(getReportContext(result, "summary_score")?.reportId).toBe("ui-summary");
    expect(getReportContext(result, { mappedTo: { remote: "summary_score" } })?.reportId).toBe(
      "ui-summary",
    );

    expect(createReportFetchRequest(result, { reportId: "ui-summary" })).toEqual(
      expect.objectContaining({
        reportContext: expect.objectContaining({ targetKey: "summary_score" }),
        reportContexts: result.reportContexts,
      }),
    );
  });

  it("passes model-specific context to same-kind async report fetches", async () => {
    const fetchReport = vi.fn(async (request) => ({
      target: (request as { reportContext?: { targetKey?: string } }).reportContext?.targetKey,
    }));
    const pack = createPack(fetchReport);
    const form = createForm({
      registry: pack.registry,
      transport: {
        submit: vi.fn().mockResolvedValue({
          reports: {},
          meta: { modelId: "risk-v2" },
        }),
      },
      schema: {
        fields: [{ kind: "number", id: "age", label: "Age", mappedTo: "age_years" }],
        reports: [
          { kind: "probe", id: "tree-a", label: "Tree A", mappedTo: "tree_a" },
          { kind: "probe", id: "tree-b", label: "Tree B", mappedTo: "tree_b" },
        ],
      },
      initialValues: { age: 42 },
    });

    const result = await executeFormPipeline({ form, reportFetchMode: "all" });

    expect(fetchReport).toHaveBeenCalledTimes(2);
    expect(fetchReport).toHaveBeenCalledWith(
      expect.objectContaining({
        reportId: "tree-a",
        reportContext: expect.objectContaining({
          reportId: "tree-a",
          targetKey: "tree_a",
          modelValues: { age_years: 42 },
          meta: { modelId: "risk-v2" },
        }),
      }),
    );
    expect(fetchReport).toHaveBeenCalledWith(
      expect.objectContaining({
        reportId: "tree-b",
        reportContext: expect.objectContaining({
          reportId: "tree-b",
          targetKey: "tree_b",
        }),
      }),
    );
    expect(result.reportFetchResults).toEqual({
      "tree-a": { target: "tree_a" },
      "tree-b": { target: "tree_b" },
    });
  });
});
