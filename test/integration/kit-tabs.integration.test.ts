// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { describe, expect, it, vi } from "vite-plus/test";
import { mountTabsForm } from "@/kit";

const flush = async (): Promise<void> => {
  await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));
  await Promise.resolve();
};

const getShadow = (element: Element | null): ShadowRoot => {
  if (!(element instanceof HTMLElement) || !element.shadowRoot) {
    throw new Error("Expected element with shadow root.");
  }

  return element.shadowRoot;
};

const getFieldControlHost = (host: HTMLElement, index: number): HTMLElement => {
  const fieldFrame = getShadow(host).querySelectorAll("mlf-field-frame").item(index) as HTMLElement;
  const fieldShadow = getShadow(fieldFrame);
  const renderer = fieldShadow.querySelector(
    "mlf-text-field, mlf-number-field, mlf-boolean-field, mlf-category-field, mlf-date-field, mlf-series-field",
  );
  return getShadow(renderer).querySelector("[aria-label]") as HTMLElement;
};

describe("kit tabs integration", () => {
  it("mounts tabs, switches active content, submits, and renders reports", async () => {
    const submit = vi.fn().mockResolvedValue({
      reports: {
        risk: {
          prediction: "high",
          labels: ["low", "high"],
          probabilities: [0.1, 0.9],
        },
      },
    });
    const container = document.createElement("div");
    document.body.append(container);

    const mounted = mountTabsForm(container, {
      transport: { submit },
      schema: {
        fields: [
          { id: "name", kind: "text", label: "Name", required: true },
          { id: "age", kind: "number", label: "Age", required: true },
        ],
        reports: [{ id: "risk", kind: "classifier", label: "Risk" }],
      },
      layout: {
        kind: "tabs",
        tabs: [
          {
            title: "Profile",
            children: [{ kind: "field", field: "name" }],
          },
          {
            title: "Details",
            children: [
              { kind: "field", field: "age" },
              { kind: "report", report: "risk" },
            ],
          },
        ],
      },
      designSystem: {
        theme: "cobalt",
        recipe: "minimal",
      },
    });

    await flush();

    expect(mounted.host.getAttribute("data-mlf-theme-id")).toBe("cobalt");
    expect(getShadow(mounted.host).textContent).toContain("Profile");
    expect(getShadow(mounted.host).textContent).not.toContain("Age");

    const tabButtons = getShadow(mounted.host).querySelectorAll(".tab");
    (tabButtons.item(1) as HTMLButtonElement).click();
    await flush();

    expect(getShadow(mounted.host).textContent).toContain("Details");

    const nameValue = mounted.form.getField("name");
    nameValue?.setValue("Alice");
    await flush();

    const ageInput = getFieldControlHost(mounted.host, 0) as HTMLInputElement;
    ageInput.value = "42";
    ageInput.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
    await flush();

    const submitButton = getShadow(mounted.host).querySelector(".btn-submit") as HTMLButtonElement;
    submitButton.click();
    await flush();
    await flush();

    expect(submit).toHaveBeenCalledWith(
      expect.objectContaining({
        serializedValues: {
          name: "Alice",
          age: 42,
        },
      }),
    );

    const reportFrame = getShadow(mounted.host).querySelector("mlf-report-frame");
    const reportRenderer = getShadow(reportFrame).querySelector("mlf-classifier-report");
    expect(getShadow(reportRenderer).textContent).toContain("high");

    mounted.unmount();
    expect(container.childElementCount).toBe(0);
    container.remove();
  });

  it("replaces a previous mounted tabs form in the same container", async () => {
    const container = document.createElement("div");
    document.body.append(container);

    const first = mountTabsForm(container, {
      transport: { submit: vi.fn().mockResolvedValue({ reports: {} }) },
      schema: {
        fields: [{ id: "first", kind: "text", label: "First" }],
      },
      layout: {
        kind: "tabs",
        tabs: [{ title: "First", children: [{ kind: "field", field: "first" }] }],
      },
    });

    const second = mountTabsForm(container, {
      transport: { submit: vi.fn().mockResolvedValue({ reports: {} }) },
      schema: {
        fields: [{ id: "second", kind: "text", label: "Second" }],
      },
      layout: {
        kind: "tabs",
        tabs: [{ title: "Second", children: [{ kind: "field", field: "second" }] }],
      },
    });

    await flush();

    expect(first.host.isConnected).toBe(false);
    expect(container.querySelectorAll("mlf-kit-tabs").length).toBe(1);
    expect(getShadow(second.host).textContent).toContain("Second");

    second.unmount();
    container.remove();
  });
});
