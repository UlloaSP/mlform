// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { describe, expect, it, vi } from "vite-plus/test";
import { mountForm } from "@/kit";
import type { FormLayoutConfig } from "@/view";

const layouts: { name: string; layout: FormLayoutConfig }[] = [
  {
    name: "single page",
    layout: {
      kind: "stacked",
      children: [
        { kind: "field", field: "name" },
        { kind: "report", report: "risk" },
      ],
    },
  },
  {
    name: "tabs",
    layout: {
      kind: "tabs",
      tabs: [
        {
          title: "Main",
          children: [
            { kind: "field", field: "name" },
            { kind: "report", report: "risk" },
          ],
        },
      ],
    },
  },
  {
    name: "wizard",
    layout: {
      kind: "wizard",
      steps: [
        {
          title: "Main",
          children: [
            { kind: "field", field: "name" },
            { kind: "report", report: "risk" },
          ],
        },
      ],
    },
  },
];

const schema = {
  fields: [{ id: "name", kind: "text", label: "Name", mappedTo: "name" }],
  reports: [{ id: "risk", kind: "classifier", label: "Risk", mappedTo: "risk" }],
};

describe("kit layout boundary regressions", () => {
  it.each(layouts)("shows a submission failure in $name", async ({ layout }) => {
    const container = document.createElement("div");
    document.body.append(container);
    const mounted = mountForm(container, {
      schema,
      layout,
      initialValues: { name: "Ada" },
      transport: {
        submit: async () => {
          throw new Error("Backend unavailable");
        },
      },
    });

    try {
      await vi.waitFor(() =>
        expect(mounted.host.shadowRoot?.querySelector(".btn-submit")).not.toBeNull(),
      );
      const submitButton = mounted.host.shadowRoot?.querySelector(".btn-submit");
      if (!(submitButton instanceof HTMLButtonElement)) throw new Error("Missing submit button");
      submitButton.click();
      await vi.waitFor(() => expect(mounted.form.state.submissionStatus).toBe("failed"));
      await vi.waitFor(() =>
        expect(
          mounted.host.shadowRoot?.querySelector("mlf-form-errors")?.shadowRoot?.textContent,
        ).toContain("Backend unavailable"),
      );
    } finally {
      mounted.unmount();
      container.remove();
    }
  });

  it.each(layouts)("honors hidden report pane in $name", async ({ layout }) => {
    const container = document.createElement("div");
    document.body.append(container);
    const mounted = mountForm(container, {
      schema,
      layout,
      reportPane: "hidden",
      transport: { submit: async () => ({ reports: [] }) },
    });
    try {
      await vi.waitFor(() =>
        expect(mounted.host.shadowRoot?.querySelector("mlf-field-frame")).not.toBeNull(),
      );
      expect(mounted.host.shadowRoot?.querySelector("mlf-report-frame")).toBeNull();
    } finally {
      mounted.unmount();
      container.remove();
    }
  });

  it("cleans the host and design after a dispose listener throws", async () => {
    const container = document.createElement("div");
    document.body.append(container);
    const mounted = mountForm(container, {
      schema: { fields: schema.fields },
      listenerErrorPolicy: "throw-aggregate",
      transport: { submit: async () => ({ reports: [] }) },
    });
    await vi.waitFor(() =>
      expect(mounted.host.shadowRoot?.querySelector("mlf-field-frame")).not.toBeNull(),
    );
    mounted.form.subscribe((state) => {
      if (state.lifecycle === "disposed") throw new Error("dispose listener failed");
    });

    expect(() => mounted.unmount()).toThrow("Store listener notification failed");
    expect(mounted.host.isConnected).toBe(false);
    expect(mounted.designSystem.resolved).toBeNull();
    expect(container.childElementCount).toBe(0);
    container.remove();
  });
});
