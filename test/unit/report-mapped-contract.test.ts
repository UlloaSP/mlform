// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { describe, expect, it, vi } from "vite-plus/test";
import { createMlRegistryPack } from "@/builtins";
import { createForm } from "@/runtime";
import { resolveMappedReportPayload } from "@/schema";

describe("report mapped contract", () => {
  it("leaves mapped report payload unresolved when report mappedTo is missing", async () => {
    const form = createForm({
      schema: {
        fields: [{ kind: "text", label: "Name" }],
        reports: [{ kind: "classifier", id: "ui-risk" }],
      },
      registry: createMlRegistryPack().registry,
      transport: {
        submit: vi.fn().mockResolvedValue({
          reports: [{ mappedTo: "risk_score", prediction: "high" }],
        }),
      },
    });

    const result = await form.submit();
    expect(result.reportStates["ui-risk"]?.status).toBe("idle");
    expect(result.reports).toEqual([{ mappedTo: "risk_score", prediction: "high" }]);
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
        transport: { submit: vi.fn().mockResolvedValue({ reports: [] }) },
      }),
    ).toThrow(/Duplicate report mappedTo "risk_score"/);
  });

  it("does not resolve legacy report output aliases", () => {
    const payload = resolveMappedReportPayload(
      { mappedTo: "new_risk" },
      {
        reports: [{ mappedTo: "old_risk", prediction: "legacy" }],
      },
    );

    expect(payload).toBeUndefined();
  });

  it("resolves report mappedTo backend maps without falling back to report id", () => {
    const payload = resolveMappedReportPayload(
      { id: "ui-risk", mappedTo: { modelA: "risk_a", modelB: "risk_b" } },
      {
        reports: [{ mappedTo: "risk_b", prediction: "high" }],
      },
    );

    expect(payload).toEqual({ prediction: "high" });
  });
});
