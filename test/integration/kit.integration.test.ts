// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { describe, expect, it, vi } from "vite-plus/test";
import { mountForm } from "@/kit";
import { flush, getFieldControlHost, getShadow, reportPayload } from "./kit-integration-helpers";
import { readyReport } from "../report-result";

describe("kit integration", () => {
  it("rejects mounting into a non-empty container unless replacement is explicit", () => {
    const container = document.createElement("div");
    container.append(document.createElement("span"));

    expect(() =>
      mountForm(container, {
        transport: {
          submit: vi.fn().mockResolvedValue({ reports: [] }),
        },
        schema: {
          fields: [{ kind: "text", label: "Name" }],
        },
      }),
    ).toThrow('Mount into an empty container or pass `containerStrategy: "replace"`.');
  });

  it("mounts a default form, submits through its transport, and applies the design system", async () => {
    const submit = vi.fn().mockResolvedValue({
      reports: [
        readyReport("risk", {
          prediction: "high",
          labels: ["low", "high"],
          probabilities: [0.1, 0.9],
        }),
      ],
    });
    const container = document.createElement("div");
    document.body.append(container);
    const mounted = mountForm(container, {
      transport: { submit },
      schema: {
        fields: [
          {
            kind: "text",
            label: "Name",
            required: true,
            mappedTo: "name",
          },
        ],
        reports: [
          {
            kind: "classifier",
            id: "risk",
            label: "Risk",
            mappedTo: "risk",
          },
        ],
      },
      labels: {
        form: "Profile",
        submit: "Predict",
      },
      designSystem: {
        theme: "cobalt",
        recipe: "minimal",
      },
    });

    await flush();

    expect(mounted.host.getAttribute("data-mlf-theme-id")).toBe("cobalt");
    expect(mounted.host.getAttribute("data-mlf-recipe-id")).toBe("minimal");
    expect(getShadow(mounted.host).textContent).toContain("Profile");

    const textInput = getFieldControlHost(mounted.host, 0) as HTMLInputElement;
    textInput.value = "Alice";
    textInput.dispatchEvent(new Event("input", { bubbles: true, composed: true }));

    await flush();

    const submitHost = getShadow(mounted.host).querySelector("mlf-submit-button");
    const submitButton = getShadow(submitHost).querySelector("button");
    submitButton?.dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true }));

    await flush();
    await flush();

    expect(submit).toHaveBeenCalledWith(
      expect.objectContaining({ modelValues: { name: "Alice" } }),
    );

    const reportFrame = getShadow(mounted.host).querySelector("mlf-report-frame");
    const reportRenderer = getShadow(reportFrame).querySelector("mlf-classifier-report");
    expect(getShadow(reportRenderer).textContent).toContain("high");

    mounted.updateDesignSystem({
      theme: "sunset",
    });

    await flush();

    expect(mounted.host.getAttribute("data-mlf-theme-id")).toBe("sunset");

    mounted.replaceDesignSystem({
      mode: "auto",
      theme: "neutral",
      recipe: "default",
    });

    await flush();

    expect(mounted.host.getAttribute("data-mlf-theme-id")).toBe("neutral");
    expect(mounted.host.getAttribute("data-mlf-recipe-id")).toBe("default");

    mounted.resetDesignSystem();

    await flush();

    expect(mounted.host.getAttribute("data-mlf-theme-id")).toBe("cobalt");
    expect(mounted.host.getAttribute("data-mlf-recipe-id")).toBe("minimal");

    mounted.unmount();
    expect(container.childElementCount).toBe(0);
    container.remove();
  });

  it("routes mounted submissions through inline transport selection", async () => {
    const localSubmit = vi.fn().mockResolvedValue({
      reports: [
        readyReport("risk", {
          prediction: "local",
          labels: ["low", "high"],
          probabilities: [0.8, 0.2],
        }),
      ],
    });
    const remoteSubmit = vi.fn().mockResolvedValue({
      reports: [
        readyReport("risk", {
          prediction: "remote",
          labels: ["low", "high"],
          probabilities: [0.1, 0.9],
        }),
      ],
    });
    const container = document.createElement("div");
    document.body.append(container);

    const mounted = mountForm(container, {
      transport: {
        submit: (request) =>
          request.modelValues.mode === "remote" ? remoteSubmit(request) : localSubmit(request),
      },
      schema: {
        fields: [
          {
            kind: "text",
            label: "Name",
            required: true,
            mappedTo: "name",
          },
          {
            id: "mode",
            kind: "text",
            label: "Mode",
            mappedTo: "mode",
          },
        ],
        reports: [
          {
            kind: "classifier",
            id: "risk",
            label: "Risk",
            mappedTo: "risk",
          },
        ],
      },
      initialValues: {
        name: "Alice",
        mode: "local",
      },
    });

    await flush();

    const localResult = await mounted.form.submit();

    expect(localSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        modelValues: {
          name: "Alice",
          mode: "local",
        },
      }),
    );
    expect(reportPayload(localResult.reports, "risk")).toMatchObject({
      prediction: "local",
    });

    await flush();

    let reportFrame = getShadow(mounted.host).querySelector("mlf-report-frame");
    let reportRenderer = getShadow(reportFrame).querySelector("mlf-classifier-report");
    expect(getShadow(reportRenderer).textContent).toContain("80.0%");

    mounted.form.setValues({
      mode: "remote",
    });

    const remoteResult = await mounted.form.submit();

    expect(remoteSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        modelValues: {
          name: "Alice",
          mode: "remote",
        },
      }),
    );
    expect(reportPayload(remoteResult.reports, "risk")).toMatchObject({
      prediction: "remote",
    });

    await flush();

    reportFrame = getShadow(mounted.host).querySelector("mlf-report-frame");
    reportRenderer = getShadow(reportFrame).querySelector("mlf-classifier-report");
    expect(getShadow(reportRenderer).textContent).toContain("90.0%");

    mounted.unmount();
    container.remove();
  });
});
