// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { mountForm } from "mlform/kit";
import { flush, getShadow } from "./kit-integration-helpers";

describe("series rendered conformance", () => {
  const cleanups: Array<() => void> = [];

  afterEach(() => {
    for (const cleanup of cleanups.splice(0).reverse()) cleanup();
  });

  const mount = (options: Parameters<typeof mountForm>[1]) => {
    const container = document.createElement("div");
    document.body.append(container);
    const mounted = mountForm(container, options);
    cleanups.push(() => {
      mounted.unmount();
      container.remove();
    });
    return mounted;
  };

  it("keeps nested constraints, focus, limits, and payload aligned", async () => {
    const submit = vi.fn().mockResolvedValue({ reports: [] });
    const mounted = mount({
      transport: { submit },
      schema: {
        fields: [
          {
            id: "observations",
            kind: "series",
            label: "Observations",
            mappedTo: "history",
            minPoints: 1,
            maxPoints: 2,
            field1: {
              kind: "text",
              label: "Code",
              required: true,
              minLength: 2,
              maxLength: 4,
              pattern: "^[A-Z]+$",
            },
            field2: {
              kind: "date",
              label: "Day",
              required: true,
              min: "2026-01-01",
              max: "2026-01-31",
              step: 2,
            },
            defaultValue: [{ field1: "AA", field2: "2026-01-01" }],
          },
        ],
      },
    });

    await flush();
    const frame = getShadow(mounted.host).querySelector("mlf-field-frame");
    const renderer = getShadow(frame).querySelector("mlf-series-field") as HTMLElement;
    const shadow = getShadow(renderer);
    const group = shadow.querySelector('[role="group"]');
    const firstText = shadow.querySelector('input[type="text"]') as HTMLInputElement;
    const firstDate = shadow.querySelector('input[type="date"]') as HTMLInputElement;
    const add = shadow.querySelector(".add-btn") as HTMLButtonElement;
    const initialRemove = shadow.querySelector(".remove-btn") as HTMLButtonElement;

    expect(group?.getAttribute("aria-label")).toBe("Observations");
    expect(firstText.minLength).toBe(2);
    expect(firstText.maxLength).toBe(4);
    expect(firstText.pattern).toBe("^[A-Z]+$");
    expect(firstDate.min).toBe("2026-01-01");
    expect(firstDate.max).toBe("2026-01-31");
    expect(firstDate.step).toBe("2");
    expect(firstDate.value).toBe("2026-01-01");
    expect(initialRemove.disabled).toBe(true);

    add.click();
    await flush();
    const textInputs = shadow.querySelectorAll<HTMLInputElement>('input[type="text"]');
    const dateInputs = shadow.querySelectorAll<HTMLInputElement>('input[type="date"]');
    expect(shadow.activeElement).toBe(textInputs.item(1));
    expect(add.disabled).toBe(true);

    textInputs.item(1).value = "x";
    textInputs.item(1).dispatchEvent(new Event("input", { bubbles: true, composed: true }));
    await flush();
    dateInputs.item(1).value = "2026-01-02";
    dateInputs.item(1).dispatchEvent(new Event("input", { bubbles: true, composed: true }));
    dateInputs.item(1).dispatchEvent(new Event("blur", { bubbles: true, composed: true }));
    await flush();

    expect(mounted.form.getField("observations")?.state.errors).toEqual(
      expect.arrayContaining([
        "Row 2 (Code): Minimum length is 2 characters.",
        "Row 2 (Code): Value does not match the expected pattern.",
        "Row 2 (Day): Date must fall on a step of 2 day(s) from the minimum date.",
      ]),
    );
    const invalidText = shadow.querySelectorAll<HTMLInputElement>('input[type="text"]').item(1);
    const describedBy = invalidText.getAttribute("aria-describedby")?.split(" ") ?? [];
    expect(invalidText.getAttribute("aria-invalid")).toBe("true");
    expect(
      describedBy.some((id) => shadow.getElementById(id)?.textContent?.includes("Row 2")),
    ).toBe(true);
    for (const id of describedBy) {
      expect(shadow.querySelectorAll(`#${id}`)).toHaveLength(1);
    }

    const currentTextInputs = shadow.querySelectorAll<HTMLInputElement>('input[type="text"]');
    const currentDateInputs = shadow.querySelectorAll<HTMLInputElement>('input[type="date"]');
    currentTextInputs.item(1).value = "BB";
    currentTextInputs.item(1).dispatchEvent(new Event("input", { bubbles: true, composed: true }));
    await flush();
    currentDateInputs.item(1).value = "2026-01-03";
    currentDateInputs.item(1).dispatchEvent(new Event("input", { bubbles: true, composed: true }));
    currentDateInputs.item(1).dispatchEvent(new Event("blur", { bubbles: true, composed: true }));

    await mounted.form.submit();
    expect(submit).toHaveBeenCalledWith(
      expect.objectContaining({
        modelValues: {
          history: [
            { field1: "AA", field2: "2026-01-01T00:00:00.000Z" },
            { field1: "BB", field2: "2026-01-03T00:00:00.000Z" },
          ],
        },
      }),
    );

    const removeButtons = shadow.querySelectorAll<HTMLButtonElement>(".remove-btn");
    removeButtons.item(0).click();
    await flush();
    expect(shadow.querySelector<HTMLButtonElement>(".remove-btn")?.disabled).toBe(true);
    expect(shadow.activeElement).toBe(add);
  });

  it("renders category and boolean sub-fields through their normal value contracts", async () => {
    const submit = vi.fn().mockResolvedValue({ reports: [] });
    const mounted = mount({
      transport: { submit },
      schema: {
        fields: [
          {
            id: "preferences",
            kind: "series",
            label: "Preferences",
            mappedTo: "preferences",
            field1: { kind: "category", label: "Tier", options: ["free", "pro"] },
            field2: {
              kind: "boolean",
              label: "Enabled",
              trueLabel: "On",
              falseLabel: "Off",
            },
            defaultValue: [{ field1: "free", field2: false }],
          },
        ],
      },
    });

    await flush();
    const frame = getShadow(mounted.host).querySelector("mlf-field-frame");
    const renderer = getShadow(frame).querySelector("mlf-series-field");
    const selects = getShadow(renderer).querySelectorAll<HTMLSelectElement>("select");
    expect(selects.item(0).getAttribute("aria-label")).toBe("Preferences Tier 1");
    expect(selects.item(1).getAttribute("aria-label")).toBe("Preferences Enabled 1");

    selects.item(0).value = "pro";
    selects.item(0).dispatchEvent(new Event("change", { bubbles: true, composed: true }));
    selects.item(1).value = "true";
    selects.item(1).dispatchEvent(new Event("change", { bubbles: true, composed: true }));
    await mounted.form.submit();

    expect(submit).toHaveBeenCalledWith(
      expect.objectContaining({
        modelValues: { preferences: [{ field1: "pro", field2: true }] },
      }),
    );
  });

  it("exposes numeric constraints and keeps focus when both row actions become unavailable", async () => {
    const mounted = mount({
      transport: { submit: vi.fn() },
      schema: {
        fields: [
          {
            id: "measurements",
            kind: "series",
            label: "Measurements",
            minPoints: 1,
            maxPoints: 1,
            field1: { kind: "number", label: "Value", min: 1, max: 5, step: 2 },
            field2: { kind: "text", label: "Note" },
            defaultValue: [
              { field1: 1, field2: "first" },
              { field1: 3, field2: "second" },
            ],
          },
        ],
      },
    });

    await flush();
    const frame = getShadow(mounted.host).querySelector("mlf-field-frame");
    const renderer = getShadow(frame).querySelector("mlf-series-field");
    const shadow = getShadow(renderer);
    const number = shadow.querySelector('input[type="number"]') as HTMLInputElement;

    expect(number.min).toBe("1");
    expect(number.max).toBe("5");
    expect(number.step).toBe("2");

    const remove = shadow.querySelector<HTMLButtonElement>(".remove-btn");
    remove?.focus();
    remove?.click();
    await flush();

    expect(shadow.querySelector<HTMLButtonElement>(".add-btn")?.disabled).toBe(true);
    expect(shadow.querySelector<HTMLButtonElement>(".remove-btn")?.disabled).toBe(true);
    expect(shadow.activeElement).toBe(shadow.querySelector(".row .control"));
  });
});
