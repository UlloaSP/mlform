// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { describe, expect, it, vi } from "vite-plus/test";
import { createMlRegistryPack } from "@/builtins";
import { createForm } from "@/runtime";
import { resolveMappedReportPayload } from "@/schema";

describe("report mapped contract", () => {
  it("uses mappedTo as external payload key for validated stream updates", async () => {
    const form = createForm({
      schema: {
        fields: [{ kind: "text", label: "Name" }],
        reports: [{ kind: "classifier", id: "ui-risk", mappedTo: "risk_score" }],
      },
      registry: createMlRegistryPack().registry,
      transport: {
        submit: vi.fn(),
        async *stream() {
          yield {
            type: "report-replace",
            reportId: "ui-risk",
            payload: { prediction: "streaming" },
          } as const;
          yield {
            type: "result",
            result: { reports: { risk_score: { prediction: "final" } } },
          } as const;
        },
      },
    });

    const result = await form.submit();

    expect(form.getReport("ui-risk")?.state).toMatchObject({
      status: "ready",
      payload: { prediction: "final" },
    });
    expect(result.reports).toEqual({ risk_score: { prediction: "final" } });
  });

  it("fails validated stream updates when report mappedTo is missing", async () => {
    const form = createForm({
      schema: {
        fields: [{ kind: "text", label: "Name" }],
        reports: [{ kind: "classifier", id: "ui-risk" }],
      },
      registry: createMlRegistryPack().registry,
      transport: {
        submit: vi.fn(),
        async *stream() {
          yield {
            type: "report-replace",
            reportId: "ui-risk",
            payload: { prediction: "streaming" },
          } as const;
          yield {
            type: "result",
            result: { reports: {} },
          } as const;
        },
      },
    });

    await expect(form.submit()).rejects.toThrow(
      /Report "ui-risk" requires mappedTo for validated stream updates/,
    );
  });

  it("fails validated stream patches when report mappedTo is missing", async () => {
    const form = createForm({
      schema: {
        fields: [{ kind: "text", label: "Name" }],
        reports: [{ kind: "classifier", id: "ui-risk" }],
      },
      registry: createMlRegistryPack().registry,
      transport: {
        submit: vi.fn(),
        async *stream() {
          yield {
            type: "report-patch",
            reportId: "ui-risk",
            patch: { prediction: "streaming" },
          } as const;
          yield {
            type: "result",
            result: { reports: {} },
          } as const;
        },
      },
    });

    await expect(form.submit()).rejects.toThrow(
      /Report "ui-risk" requires mappedTo for validated stream updates/,
    );
  });

  it("fails keyed backend report payloads when report mappedTo is missing", async () => {
    const form = createForm({
      schema: {
        fields: [{ kind: "text", label: "Name" }],
        reports: [{ kind: "classifier", id: "ui-risk" }],
      },
      registry: createMlRegistryPack().registry,
      transport: {
        submit: vi.fn().mockResolvedValue({
          reports: { risk_score: { prediction: "high" } },
        }),
      },
    });

    await expect(form.submit()).rejects.toThrow(
      /Report requires mappedTo when backend response contains keyed reports/,
    );
  });

  it("fails duplicate report mapped targets at schema normalization", () => {
    expect(() =>
      createForm({
        schema: {
          fields: [{ kind: "text", label: "Name" }],
          reports: [
            { kind: "classifier", id: "risk-a", mappedTo: "risk_score" },
            { kind: "classifier", id: "risk-b", mappedTo: "risk_score" },
          ],
        },
        registry: createMlRegistryPack().registry,
        transport: { submit: vi.fn().mockResolvedValue({ reports: {} }) },
      }),
    ).toThrow(/Duplicate report mappedTo "risk_score"/);
  });

  it("supports explicit report output aliases during migration", () => {
    const onAlias = vi.fn();
    const payload = resolveMappedReportPayload(
      { mappedTo: "new_risk" },
      {
        reports: { old_risk: { prediction: "legacy" } },
        raw: null,
      },
      {
        aliases: ["old_risk"],
        onAlias,
      },
    );

    expect(payload).toEqual({ prediction: "legacy" });
    expect(onAlias).toHaveBeenCalledWith("old_risk", "new_risk");
  });
});
