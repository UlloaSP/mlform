// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { describe, expect, it, vi } from "vite-plus/test";
import { createMlRegistryPack } from "@/builtins";
import { createForm } from "@/runtime";
import { resolveMappedReportPayload, resolveMappedRoutes } from "@/schema";

describe("report mapped contract", () => {
  it("lists equal targets for every backend route", () => {
    expect(resolveMappedRoutes({ risk: "score", cost: "score" }, undefined)).toEqual([
      { backend: "risk", mappedTo: "score" },
      { backend: "cost", mappedTo: "score" },
    ]);
  });

  it("leaves mapped report payload unresolved when report mappedTo is missing", async () => {
    const form = createForm({
      schema: {
        fields: [{ kind: "text", label: "Name" }],
        reports: [{ kind: "classifier", id: "ui-risk" }],
      },
      registry: createMlRegistryPack().registry,
      transport: {
        submit: vi.fn().mockResolvedValue({
          reports: [],
        }),
      },
    });

    const result = await form.submit();
    expect(result.reportStates["ui-risk"]?.status).toBe("idle");
    expect(result.reports).toEqual([]);
  });

  it("lets distinct report controllers consume one backend payload", async () => {
    const form = createForm({
      schema: {
        fields: [{ kind: "text", label: "Name" }],
        reports: [
          { kind: "classifier", id: "risk-a", mappedTo: "risk_score" },
          { kind: "classifier", id: "risk-b", mappedTo: "risk_score" },
        ],
      },
      registry: createMlRegistryPack().registry,
      transport: {
        submit: vi.fn().mockResolvedValue({
          reports: [
            {
              backend: "model-a",
              mappedTo: "risk_score",
              status: "ready",
              payload: { prediction: "high" },
            },
          ],
        }),
      },
    });

    const result = await form.submit({ backend: "model-a" });
    expect(result.reportStates["risk-a"]).toEqual(
      expect.objectContaining({ status: "ready", payload: { prediction: "high" } }),
    );
    expect(result.reportStates["risk-b"]).toEqual(
      expect.objectContaining({ status: "ready", payload: { prediction: "high" } }),
    );
  });

  it("resolves the exact backend and mappedTo pair", () => {
    const payload = resolveMappedReportPayload(
      { id: "ui-risk", mappedTo: { modelA: "risk", modelB: "risk" } },
      {
        backend: "modelA",
        reports: [
          { backend: "modelA", mappedTo: "risk", status: "ready", payload: { score: 1 } },
          { backend: "modelB", mappedTo: "risk", status: "ready", payload: { score: 2 } },
        ],
      },
    );

    expect(payload).toEqual({ score: 1 });
  });

  it("rejects legacy report payload shapes", async () => {
    const form = createForm({
      schema: {
        fields: [{ kind: "text", label: "Name" }],
        reports: [{ kind: "classifier", id: "risk", mappedTo: "risk_score" }],
      },
      registry: createMlRegistryPack().registry,
      transport: {
        submit: vi.fn().mockResolvedValue({
          reports: [{ mappedTo: "risk_score", prediction: "high" }],
        }),
      },
    });

    await expect(form.submit()).rejects.toThrow(/invalid report result/i);
  });

  it("commits skipped as a terminal report state", async () => {
    const pack = createMlRegistryPack();

    const form = createForm({
      schema: {
        fields: [{ kind: "text", label: "Name" }],
        reports: [{ kind: "classifier", id: "risk", mappedTo: "risk_score" }],
      },
      registry: pack.registry,
      transport: {
        submit: vi.fn().mockResolvedValue({
          reports: [
            {
              backend: "model-a",
              mappedTo: "risk_score",
              status: "skipped",
              reason: "not-applicable",
            },
          ],
        }),
      },
    });

    const result = await form.submit({ backend: "model-a" });
    expect(result.reportStates.risk).toEqual({
      payload: undefined,
      error: null,
      status: "skipped",
    });
  });
});
