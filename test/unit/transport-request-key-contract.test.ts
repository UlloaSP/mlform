// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { describe, expect, it, vi } from "vite-plus/test";
import { withDedup } from "@/transport";

const request = (reportId: string) =>
  ({
    backend: "remote",
    values: { age: 42 },
    fieldValues: { "ui-age": 42 },
    serializedValues: { model_age: 42 },
    serializedFieldValues: { "ui-age": 42 },
    fields: [],
    reports: [{ id: reportId, kind: "classifier", mappedTo: { default: "risk", remote: "score" } }],
  }) as const;

describe("transport request key contract", () => {
  it("dedups by report mapped target instead of report id when mappedTo resolves", async () => {
    let resolveSubmit: ((value: unknown) => void) | undefined;
    const submit = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSubmit = resolve;
        }),
    );
    const transport = withDedup()({ submit });

    const first = transport.submit(request("ui-risk-a"));
    const second = transport.submit(request("ui-risk-b"));
    resolveSubmit?.({ reports: [{ mappedTo: "score", prediction: "high" }] });

    await expect(first).resolves.toEqual({ reports: [{ mappedTo: "score", prediction: "high" }] });
    await expect(second).resolves.toEqual({ reports: [{ mappedTo: "score", prediction: "high" }] });
    expect(submit).toHaveBeenCalledTimes(1);
  });
});
