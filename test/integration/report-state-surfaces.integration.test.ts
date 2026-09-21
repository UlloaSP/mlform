// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { describe, expect, it, vi } from "vite-plus/test";
import { mountForm } from "@/kit";
import { flush, getShadow } from "./kit-integration-helpers";
import { readyReport } from "../report-result";

describe("report state surfaces", () => {
  it("summarizes idle and loading reports, then renders ready reports with help", async () => {
    let resolveSubmit!: (value: { reports: ReturnType<typeof readyReport>[] }) => void;
    const submitResult = new Promise<{ reports: ReturnType<typeof readyReport>[] }>((resolve) => {
      resolveSubmit = resolve;
    });
    const container = document.createElement("div");
    document.body.append(container);
    const mounted = mountForm(container, {
      layout: { kind: "split" },
      transport: { submit: vi.fn().mockReturnValue(submitResult) },
      schema: {
        fields: [{ kind: "text", label: "Name", mappedTo: "name" }],
        reports: [
          {
            kind: "classifier",
            id: "risk",
            label: "Risk",
            description: "Estimated risk by class.",
            mappedTo: "risk_result",
          },
          {
            kind: "regressor",
            id: "score",
            label: "Score",
            description: "Estimated numeric score.",
            mappedTo: "score_result",
          },
        ],
      },
    });
    await flush();

    let shadow = getShadow(mounted.host);
    expect(shadow.querySelector(".empty-report-state")?.textContent).toContain("Results");
    expect(shadow.querySelector("mlf-report-frame")).toBeNull();

    const submission = mounted.form.submit();
    await flush();
    shadow = getShadow(mounted.host);
    expect(shadow.querySelector(".loading-report-state")?.getAttribute("aria-busy")).toBe("true");
    expect(shadow.querySelectorAll(".report-skeleton span")).toHaveLength(3);

    resolveSubmit({
      reports: [
        readyReport("risk_result", { labels: ["low", "high"], probabilities: [0.8, 0.2] }),
        readyReport("score_result", { value: 12 }),
      ],
    });
    await submission;
    await flush();

    const frames = getShadow(mounted.host).querySelectorAll("mlf-report-frame");
    expect(frames).toHaveLength(2);
    const riskShadow = getShadow(frames.item(0));
    const help = riskShadow.querySelector<HTMLButtonElement>(".help-btn");
    const description = riskShadow.querySelector<HTMLElement>(".description");
    expect(help?.getAttribute("aria-label")).toBe("Help: Risk");
    expect(help?.getAttribute("aria-expanded")).toBe("false");
    expect(help?.getAttribute("aria-controls")).toBe(description?.id);
    expect(description?.hidden).toBe(true);
    help?.click();
    await flush();
    expect(help?.getAttribute("aria-expanded")).toBe("true");
    expect(description?.hidden).toBe(false);

    mounted.unmount();
    container.remove();
  });

  it("renders skipped reports explicitly without mounting their renderer", async () => {
    const container = document.createElement("div");
    document.body.append(container);
    const mounted = mountForm(container, {
      layout: { kind: "split" },
      transport: {
        submit: vi.fn().mockResolvedValue({
          reports: [{ backend: "default", mappedTo: "risk_result", status: "skipped" as const }],
        }),
      },
      schema: {
        fields: [{ kind: "text", label: "Name", mappedTo: "name" }],
        reports: [{ kind: "classifier", id: "risk", label: "Risk", mappedTo: "risk_result" }],
      },
    });

    await mounted.form.submit();
    await flush();
    const frame = getShadow(mounted.host).querySelector("mlf-report-frame");
    const frameShadow = getShadow(frame);
    expect(frameShadow.querySelector(".state-title")?.textContent).toContain("Report skipped");
    expect(frameShadow.querySelector(".help-btn")?.hasAttribute("disabled")).toBe(true);
    expect(frameShadow.querySelector("mlf-classifier-report")).toBeNull();

    mounted.unmount();
    container.remove();
  });
});
