// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { describe, expect, it, vi } from "vite-plus/test";
import { createPrimitiveAdapter } from "@/kit";
import { createFormView } from "@/view";
import { readyReport } from "../report-result";

describe("primitive adapter", () => {
  it("retains frames while fields, reports and layout visibility change", async () => {
    const view = createFormView({
      schema: {
        fields: [{ kind: "text", id: "name", label: "Name", mappedTo: "name" }],
        reports: [{ kind: "classifier", id: "prediction", mappedTo: "prediction" }],
      },
      transport: {
        submit: async () => ({ reports: [readyReport("prediction", { prediction: "yes" })] }),
      },
      layout: {
        kind: "tabs",
        tabs: [
          { id: "input", title: "Input", children: [{ kind: "field", field: "name" }] },
          { id: "output", title: "Output", children: [{ kind: "report", report: "prediction" }] },
        ],
      },
    });
    const host = document.createElement("div");
    const fieldSlot = document.createElement("div");
    const reportSlot = document.createElement("div");
    host.append(fieldSlot, reportSlot);
    document.body.append(host);
    const ui = createPrimitiveAdapter(view);
    try {
      const field = ui.mountField(fieldSlot, "name");
      const report = ui.mountReport(reportSlot, "prediction");
      expect(fieldSlot.firstElementChild).toBe(field);
      expect(reportSlot.firstElementChild).toBe(report);
      expect(field.hidden).toBe(false);
      expect(report.hidden).toBe(true);

      view.form.getField("name")?.setValue("Ada");
      expect(fieldSlot.firstElementChild).toBe(field);
      await view.navigation.activate("output");
      expect(field.hidden).toBe(true);
      await view.submit();
      expect(reportSlot.firstElementChild).toBe(report);
      expect(report.hidden).toBe(false);
      await view.navigation.activate("input");
      expect(field.hidden).toBe(false);
      expect(report.hidden).toBe(true);
    } finally {
      ui.dispose();
      expect(fieldSlot.childElementCount).toBe(0);
      expect(reportSlot.childElementCount).toBe(0);
      view.dispose();
      host.remove();
    }
  });

  it("rejects invalid mounts and leaves the view owned by the caller", () => {
    const view = createFormView({
      schema: { fields: [{ kind: "text", id: "name", label: "Name" }] },
      transport: { submit: vi.fn().mockResolvedValue({ reports: [] }) },
    });
    const slot = document.createElement("div");
    const other = document.createElement("div");
    const ui = createPrimitiveAdapter(view);
    expect(() => ui.mountField(slot, "missing")).toThrow('Unknown field "missing".');
    const foreignSlot = document.implementation.createHTMLDocument().createElement("div");
    expect(() => ui.mountField(foreignSlot, "name")).toThrow(
      "MLForm elements are not registered in the container's document.",
    );
    const frame = ui.mountField(slot, "name");
    expect(() => ui.mountField(other, "name")).toThrow('MLForm control "name" is already mounted.');
    expect(() => ui.mountField(slot, "name")).toThrow(
      "Slot already contains a mounted MLForm control.",
    );
    ui.dispose();
    ui.dispose();
    expect(frame.parentElement).toBeNull();
    view.form.getField("name")?.setValue("still active");
    expect(view.getField("name")?.state.value).toBe("still active");
    expect(() => ui.mountField(other, "name")).toThrow("Primitive adapter is disposed.");
    view.dispose();
  });
});
