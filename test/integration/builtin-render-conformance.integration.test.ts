// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { mountForm } from "mlform/kit";
import { flush, getShadow } from "./kit-integration-helpers";
import { readyReport } from "../report-result";

const getRenderer = (host: HTMLElement, index: number, selector: string): HTMLElement => {
  const frame = getShadow(host).querySelectorAll("mlf-field-frame").item(index);
  const renderer = getShadow(frame).querySelector(selector);
  if (!(renderer instanceof HTMLElement)) throw new Error(`Missing renderer ${selector}.`);
  return renderer;
};

describe("builtin rendered conformance", () => {
  const cleanups: Array<() => void> = [];

  afterEach(() => {
    for (const cleanup of cleanups.splice(0).reverse()) cleanup();
  });

  it("keeps choice and text contracts aligned from DOM input to backend payload", async () => {
    const submit = vi.fn().mockResolvedValue({ reports: [] });
    const container = document.createElement("div");
    document.body.append(container);
    const mounted = mountForm(container, {
      transport: { submit },
      schema: {
        fields: [
          {
            id: "bio",
            kind: "long-text",
            label: "Bio",
            minLength: 3,
            maxLength: 5,
            rows: 6,
            mappedTo: "bio_text",
          },
          {
            id: "plan",
            kind: "single-choice",
            label: "Plan",
            options: ["free", { label: "Professional", value: "pro" }],
            mappedTo: "plan_code",
          },
          {
            id: "channels",
            kind: "multi-choice",
            label: "Channels",
            options: ["email", "sms"],
            mappedTo: "channel_codes",
          },
          {
            id: "score",
            kind: "rating",
            label: "Score",
            min: 1,
            max: 5,
            step: 2,
            mappedTo: "score_value",
          },
        ],
      },
    });
    cleanups.push(() => {
      mounted.unmount();
      container.remove();
    });

    await flush();

    const longText = getRenderer(mounted.host, 0, "mlf-long-text-field");
    const textarea = getShadow(longText).querySelector("textarea") as HTMLTextAreaElement;
    expect(textarea.minLength).toBe(3);
    expect(textarea.maxLength).toBe(5);
    expect(textarea.rows).toBe(6);
    textarea.value = "hello";
    textarea.dispatchEvent(new Event("input", { bubbles: true, composed: true }));

    const singleChoice = getRenderer(mounted.host, 1, "mlf-single-choice-field");
    const radioGroup = getShadow(singleChoice).querySelector('[role="radiogroup"]');
    expect(radioGroup?.getAttribute("aria-label")).toBe("Plan");
    const pro = getShadow(singleChoice).querySelector('input[value="pro"]') as HTMLInputElement;
    pro.click();

    const multiChoice = getRenderer(mounted.host, 2, "mlf-multi-choice-field");
    const choiceGroup = getShadow(multiChoice).querySelector('[role="group"]');
    expect(choiceGroup?.getAttribute("aria-label")).toBe("Channels");
    for (const checkbox of getShadow(multiChoice).querySelectorAll<HTMLInputElement>("input")) {
      checkbox.click();
    }

    const rating = getRenderer(mounted.host, 3, "mlf-rating-field");
    const ratingGroup = getShadow(rating).querySelector('[role="radiogroup"]');
    expect(ratingGroup?.getAttribute("aria-label")).toBe("Score");
    const ratingButtons = getShadow(rating).querySelectorAll<HTMLButtonElement>("button");
    expect([...ratingButtons].map(({ textContent }) => textContent?.trim())).toEqual([
      "1",
      "3",
      "5",
    ]);

    mounted.form.getField("score")?.setValue(4);
    const invalidRating = await mounted.form.getField("score")?.validate();
    expect(invalidRating?.errors).toContain("Value must follow a step of 2 from 1.");
    ratingButtons.item(0).focus();
    ratingButtons.item(0).dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }));
    expect(getShadow(rating).activeElement?.textContent?.trim()).toBe("3");

    await mounted.form.submit();
    expect(submit).toHaveBeenCalledWith(
      expect.objectContaining({
        modelValues: {
          bio_text: "hello",
          plan_code: "pro",
          channel_codes: ["email", "sms"],
          score_value: 3,
        },
      }),
    );

    mounted.form.getField("channels")?.setValue(["email", "email", "sms"]);
    expect(mounted.form.getField("channels")?.state.value).toEqual(["email", "sms"]);
  });

  it("renders both report kinds through explicit mapped targets", async () => {
    const container = document.createElement("div");
    document.body.append(container);
    const mounted = mountForm(container, {
      transport: {
        submit: vi.fn().mockResolvedValue({
          reports: [
            readyReport("risk_result", {
              prediction: "approve",
              labels: ["approve", "deny"],
              probabilities: [0.8, 0.2],
            }),
            readyReport("score_result", { value: 12.345, interval: [10, 15] }),
          ],
        }),
      },
      schema: {
        fields: [{ kind: "text", label: "Name", mappedTo: "name" }],
        reports: [
          { kind: "classifier", id: "risk", label: "Risk", mappedTo: "risk_result" },
          {
            kind: "regressor",
            id: "score",
            label: "Score",
            mappedTo: "score_result",
            precision: 1,
            unit: "ms",
          },
        ],
      },
    });
    cleanups.push(() => {
      mounted.unmount();
      container.remove();
    });

    await mounted.form.submit();
    await flush();

    const reportFrames = getShadow(mounted.host).querySelectorAll("mlf-report-frame");
    const classifier = getShadow(reportFrames.item(0)).querySelector("mlf-classifier-report");
    const regressor = getShadow(reportFrames.item(1)).querySelector("mlf-regressor-report");
    const classifierShadow = getShadow(classifier);
    const regressorShadow = getShadow(regressor);

    expect(classifierShadow.querySelector("section")?.getAttribute("aria-label")).toBe("Risk");
    expect(classifierShadow.textContent).toContain("80.0%");
    expect(regressorShadow.querySelector("section")?.getAttribute("aria-label")).toBe("Score");
    expect(regressorShadow.textContent).toContain("12.3 ms");
  });
});
