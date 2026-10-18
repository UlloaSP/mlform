// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { mountForm } from "mlform/kit";
import { flush, getShadow } from "./kit-integration-helpers";

describe("series aggregation rendering", () => {
  const cleanups: Array<() => void> = [];
  afterEach(() =>
    cleanups
      .splice(0)
      .reverse()
      .forEach((cleanup) => cleanup()),
  );

  const mount = (readOnly = false, showAggregationSummary?: boolean) => {
    const container = document.createElement("div");
    document.body.append(container);
    const submit = vi.fn().mockResolvedValue({ reports: [] });
    const mounted = mountForm(container, {
      transport: { submit },
      schema: {
        fields: [
          {
            id: "pressure",
            kind: "series",
            label: "Blood pressure",
            displayKey: "Measurements",
            readOnly,
            showAggregationSummary,
            minPoints: 1,
            maxPoints: 3,
            columns: [
              { id: "field1", kind: "number", label: "Systolic", unit: "mmHg" },
              { id: "field2", kind: "number", label: "Diastolic", required: true },
            ],
            defaultValue: [
              { field1: 120, field2: 80 },
              { field1: 140, field2: 90 },
            ],
            aggregations: [
              { label: "Maximum systolic", source: "field1", operation: "max", mappedTo: "max" },
              { label: "Mean systolic", source: "field1", operation: "mean", mappedTo: "mean" },
            ],
          },
        ],
      },
    });
    cleanups.push(() => {
      mounted.unmount();
      container.remove();
    });
    return { mounted, submit };
  };

  it("updates the summary and payload when rows are edited, added, or removed", async () => {
    const { mounted, submit } = mount(false, true);
    await flush();
    const frame = getShadow(mounted.host).querySelector("mlf-field-frame");
    const shadow = getShadow(getShadow(frame).querySelector("mlf-series-field"));
    const results = () =>
      [...shadow.querySelectorAll(".aggregation-result dd")].map((node) =>
        node.textContent?.trim().replace(/\s+/gu, " "),
      );
    const controls = () => shadow.querySelectorAll<HTMLInputElement>('input[role="spinbutton"]');
    const edit = async (index: number, value: string) => {
      controls().item(index).value = value;
      controls()
        .item(index)
        .dispatchEvent(new Event("input", { bubbles: true, composed: true }));
      await flush();
    };

    expect(results()).toEqual(["140 mmHg", "130 mmHg"]);
    expect(shadow.querySelector("dl")?.getAttribute("aria-live")).toBe("polite");
    expect(controls().item(0).required).toBe(true);
    await edit(0, "160");
    expect(results()).toEqual(["160 mmHg", "150 mmHg"]);

    shadow.querySelector<HTMLButtonElement>(".add-btn")?.click();
    await flush();
    expect(shadow.activeElement).toBe(controls().item(4));
    expect(results()).toEqual(["—", "—"]);
    expect(shadow.querySelector<HTMLButtonElement>(".add-btn")?.disabled).toBe(true);
    await expect(mounted.form.submit()).rejects.toMatchObject({ name: "ValidationError" });
    expect(submit).not.toHaveBeenCalled();

    await edit(4, "120");
    await edit(5, "80");
    expect(results()).toEqual(["160 mmHg", "140 mmHg"]);
    shadow.querySelectorAll<HTMLButtonElement>(".remove-btn").item(0).click();
    await flush();
    expect(results()).toEqual(["140 mmHg", "130 mmHg"]);
    await mounted.form.submit();
    expect(submit).toHaveBeenCalledWith(
      expect.objectContaining({
        modelValues: { max: 140, mean: 130 },
        displayValues: {
          Measurements: [
            { field1: 140, field2: 90 },
            { field1: 120, field2: 80 },
          ],
        },
      }),
    );
    mounted.form.reset();
    await flush();
    expect(results()).toEqual(["140 mmHg", "130 mmHg"]);
  });

  it("keeps aggregates readable while row editing is locked", async () => {
    const { mounted } = mount(true, true);
    await flush();
    const frame = getShadow(mounted.host).querySelector("mlf-field-frame");
    const shadow = getShadow(getShadow(frame).querySelector("mlf-series-field"));
    expect(shadow.querySelector<HTMLButtonElement>(".add-btn")?.disabled).toBe(true);
    expect(shadow.querySelector<HTMLButtonElement>(".remove-btn")?.disabled).toBe(true);
    expect(shadow.querySelector<HTMLInputElement>("input")?.readOnly).toBe(true);
    expect(shadow.querySelector("dl")?.textContent).toContain("140");
  });

  it.each([undefined, false])(
    "hides aggregate details by default or explicitly (%s) without changing submission",
    async (showSummary) => {
      const { mounted, submit } = mount(false, showSummary);
      await flush();
      const frame = getShadow(mounted.host).querySelector("mlf-field-frame");
      const shadow = getShadow(getShadow(frame).querySelector("mlf-series-field"));
      expect(shadow.querySelector(".aggregation-summary")).toBeNull();
      expect(shadow.textContent).not.toContain("Maximum systolic");
      const input = shadow.querySelector<HTMLInputElement>('input[role="spinbutton"]')!;
      input.value = "160";
      input.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
      await flush();
      await mounted.form.submit();
      expect(submit).toHaveBeenCalledWith(
        expect.objectContaining({ modelValues: { max: 160, mean: 150 } }),
      );
      expect(shadow.querySelector(".aggregation-summary")).toBeNull();
    },
  );
});
