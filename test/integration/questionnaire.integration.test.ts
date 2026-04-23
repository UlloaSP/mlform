// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { mountQuestionnaire, unmountQuestionnaire } from "@/questionnaire";

// ── Test helpers ──────────────────────────────────────────────────────────────

const flush = async (): Promise<void> => {
  await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));
  await Promise.resolve();
};

const getShadow = (element: Element | null): ShadowRoot => {
  if (!(element instanceof HTMLElement) || !element.shadowRoot) {
    throw new Error(`Expected element with shadow root, got ${element?.tagName ?? "null"}.`);
  }
  return element.shadowRoot;
};

const getQuestionnaireHost = (container: HTMLElement): HTMLElement => {
  const host = container.querySelector("mlf-questionnaire");
  if (!(host instanceof HTMLElement)) {
    throw new Error("Expected mlf-questionnaire element.");
  }
  return host;
};

const getStepIndicator = (host: HTMLElement): HTMLElement => {
  const indicator = getShadow(host).querySelector("mlf-step-indicator");
  if (!(indicator instanceof HTMLElement)) {
    throw new Error("Expected mlf-step-indicator element.");
  }
  return indicator;
};

const getFieldFrames = (host: HTMLElement): NodeListOf<HTMLElement> => {
  return getShadow(host).querySelectorAll("mlf-field-frame") as NodeListOf<HTMLElement>;
};

const getNextButton = (host: HTMLElement): HTMLButtonElement => {
  const btn = getShadow(host).querySelector(".btn-next, .btn-submit") as HTMLButtonElement | null;
  if (!btn) throw new Error("Expected next/submit button.");
  return btn;
};

const getPrevButton = (host: HTMLElement): HTMLButtonElement => {
  const btn = getShadow(host).querySelector(".btn-prev") as HTMLButtonElement | null;
  if (!btn) throw new Error("Expected prev button.");
  return btn;
};

const makeTransport = () => ({ submit: vi.fn().mockResolvedValue({}) });

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("questionnaire integration", () => {
  const containers: HTMLElement[] = [];

  const makeContainer = (): HTMLElement => {
    const div = document.createElement("div");
    document.body.append(div);
    containers.push(div);
    return div;
  };

  afterEach(() => {
    for (const container of containers) {
      container.remove();
    }
    containers.length = 0;
  });

  it("mounts mlf-questionnaire into the container", async () => {
    const container = makeContainer();

    const mounted = mountQuestionnaire(container, {
      transport: makeTransport(),
      schema: {
        steps: [
          {
            title: "About You",
            fields: [{ kind: "text", label: "Name" }],
          },
        ],
      },
    });

    await flush();

    expect(container.querySelector("mlf-questionnaire")).toBeTruthy();
    expect(mounted.host.tagName.toLowerCase()).toBe("mlf-questionnaire");
    expect(mounted.controller).toBeDefined();
    expect(mounted.form).toBeDefined();
    expect(mounted.designSystem).toBeDefined();

    mounted.unmount();
  });

  it("renders step indicator with correct step count", async () => {
    const container = makeContainer();

    const mounted = mountQuestionnaire(container, {
      transport: makeTransport(),
      schema: {
        steps: [
          { title: "Step 1", fields: [{ kind: "text", label: "A" }] },
          { title: "Step 2", fields: [{ kind: "text", label: "B" }] },
          { title: "Step 3", fields: [{ kind: "text", label: "C" }] },
        ],
      },
    });

    await flush();

    const host = getQuestionnaireHost(container);
    const indicator = getStepIndicator(host);
    const shadow = getShadow(indicator);

    // progress fraction shows "current / total"
    expect(shadow.textContent).toContain("1");
    expect(shadow.textContent).toContain("3");

    mounted.unmount();
  });

  it("renders only current step's fields", async () => {
    const container = makeContainer();

    const mounted = mountQuestionnaire(container, {
      transport: makeTransport(),
      schema: {
        steps: [
          {
            title: "Step 1",
            fields: [
              { kind: "text", label: "Field A" },
              { kind: "text", label: "Field B" },
            ],
          },
          {
            title: "Step 2",
            fields: [{ kind: "text", label: "Field C" }],
          },
        ],
      },
    });

    await flush();

    const host = getQuestionnaireHost(container);
    const frames = getFieldFrames(host);

    // Step 1 has 2 fields
    expect(frames.length).toBe(2);

    mounted.unmount();
  });

  it("shows step title in the header", async () => {
    const container = makeContainer();

    const mounted = mountQuestionnaire(container, {
      transport: makeTransport(),
      schema: {
        steps: [
          {
            title: "Tell Us About Yourself",
            fields: [{ kind: "text", label: "Name" }],
          },
        ],
      },
    });

    await flush();

    const host = getQuestionnaireHost(container);
    const shadow = getShadow(host);

    expect(shadow.textContent).toContain("Tell Us About Yourself");

    mounted.unmount();
  });

  it("next() advances to next step and updates field list", async () => {
    const container = makeContainer();

    const mounted = mountQuestionnaire(container, {
      transport: makeTransport(),
      schema: {
        steps: [
          { title: "Step 1", fields: [{ kind: "text", label: "First Name" }] },
          { title: "Step 2", fields: [{ kind: "text", label: "Email" }] },
        ],
      },
    });

    await flush();

    const host = getQuestionnaireHost(container);

    expect(getShadow(host).textContent).toContain("Step 1");

    const advanced = await mounted.controller.next();
    expect(advanced).toBe(true);

    await flush();

    expect(getShadow(host).textContent).toContain("Step 2");

    const frames = getFieldFrames(host);
    expect(frames.length).toBe(1); // Step 2 has 1 field

    mounted.unmount();
  });

  it("prev() goes back to previous step", async () => {
    const container = makeContainer();

    const mounted = mountQuestionnaire(container, {
      transport: makeTransport(),
      schema: {
        steps: [
          { title: "Step 1", fields: [{ kind: "text", label: "A" }] },
          { title: "Step 2", fields: [{ kind: "text", label: "B" }] },
        ],
      },
    });

    await flush();

    await mounted.controller.next();
    await flush();

    expect(getShadow(getQuestionnaireHost(container)).textContent).toContain("Step 2");

    mounted.controller.prev();
    await flush();

    expect(getShadow(getQuestionnaireHost(container)).textContent).toContain("Step 1");

    mounted.unmount();
  });

  it("prev button is disabled on first step", async () => {
    const container = makeContainer();

    const mounted = mountQuestionnaire(container, {
      transport: makeTransport(),
      schema: {
        steps: [{ title: "Step 1", fields: [{ kind: "text", label: "A" }] }],
      },
    });

    await flush();

    const host = getQuestionnaireHost(container);
    const prevBtn = getPrevButton(host);

    expect(prevBtn.disabled).toBe(true);

    mounted.unmount();
  });

  it("next() returns false when a required field is empty, and does not advance", async () => {
    const container = makeContainer();

    const mounted = mountQuestionnaire(container, {
      transport: makeTransport(),
      schema: {
        steps: [
          {
            title: "Required",
            fields: [{ kind: "text", label: "Name", required: true }],
          },
          {
            title: "Step 2",
            fields: [{ kind: "text", label: "Other" }],
          },
        ],
      },
    });

    await flush();

    const advanced = await mounted.controller.next();
    expect(advanced).toBe(false);
    expect(mounted.controller.state.stepIndex).toBe(0);

    await flush();

    // Still on step 1
    expect(getShadow(getQuestionnaireHost(container)).textContent).toContain("Required");

    mounted.unmount();
  });

  it("fires mlf-step-change event on advance", async () => {
    const container = makeContainer();
    const handler = vi.fn();
    container.addEventListener("mlf-step-change", handler);

    const mounted = mountQuestionnaire(container, {
      transport: makeTransport(),
      schema: {
        steps: [
          { title: "Step 1", fields: [{ kind: "text", label: "A" }] },
          { title: "Step 2", fields: [{ kind: "text", label: "B" }] },
        ],
      },
    });

    await flush();

    const host = getQuestionnaireHost(container);
    const nextBtn = getNextButton(host);
    nextBtn.dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true }));

    await flush();

    expect(handler).toHaveBeenCalledOnce();

    mounted.unmount();
  });

  it("fires mlf-q-submit-success on last step submit", async () => {
    const container = makeContainer();
    const successHandler = vi.fn();
    container.addEventListener("mlf-q-submit-success", successHandler);

    const transport = makeTransport();

    const mounted = mountQuestionnaire(container, {
      transport,
      schema: {
        steps: [{ title: "Only Step", fields: [{ kind: "text", label: "Name" }] }],
      },
    });

    await flush();

    const host = getQuestionnaireHost(container);
    const submitBtn = getNextButton(host); // last step shows submit button
    submitBtn.dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true }));

    await flush();
    await flush();

    expect(transport.submit).toHaveBeenCalledOnce();
    expect(successHandler).toHaveBeenCalledOnce();

    mounted.unmount();
  });

  it("unmount() removes host from DOM", async () => {
    const container = makeContainer();

    const mounted = mountQuestionnaire(container, {
      transport: makeTransport(),
      schema: {
        steps: [{ title: "Step 1", fields: [{ kind: "text", label: "A" }] }],
      },
    });

    await flush();

    expect(container.querySelector("mlf-questionnaire")).toBeTruthy();

    mounted.unmount();

    expect(container.querySelector("mlf-questionnaire")).toBeFalsy();
  });

  it("unmountQuestionnaire() helper works", async () => {
    const container = makeContainer();

    const mounted = mountQuestionnaire(container, {
      transport: makeTransport(),
      schema: {
        steps: [{ title: "Step 1", fields: [{ kind: "text", label: "A" }] }],
      },
    });

    await flush();

    unmountQuestionnaire(mounted);

    expect(container.querySelector("mlf-questionnaire")).toBeFalsy();
  });

  it("remount into same container cleanly replaces previous", async () => {
    const container = makeContainer();

    const first = mountQuestionnaire(container, {
      transport: makeTransport(),
      schema: {
        steps: [{ title: "First", fields: [{ kind: "text", label: "A" }] }],
      },
    });

    await flush();

    const second = mountQuestionnaire(container, {
      transport: makeTransport(),
      schema: {
        steps: [{ title: "Second", fields: [{ kind: "text", label: "B" }] }],
      },
    });

    await flush();

    expect(container.querySelectorAll("mlf-questionnaire").length).toBe(1);
    expect(getShadow(getQuestionnaireHost(container)).textContent).toContain("Second");

    // first should no longer be mounted
    expect(() => first.unmount()).not.toThrow();
    second.unmount();
  });

  it("applies design system tokens to host", async () => {
    const container = makeContainer();

    const mounted = mountQuestionnaire(container, {
      transport: makeTransport(),
      designSystem: { theme: "cobalt", recipe: "minimal" },
      schema: {
        steps: [{ title: "Step 1", fields: [{ kind: "text", label: "A" }] }],
      },
    });

    await flush();

    expect(mounted.host.getAttribute("data-mlf-theme-id")).toBe("cobalt");
    expect(mounted.host.getAttribute("data-mlf-recipe-id")).toBe("minimal");

    mounted.unmount();
  });

  it("renders single-choice and rating fields from new field types", async () => {
    const container = makeContainer();

    const mounted = mountQuestionnaire(container, {
      transport: makeTransport(),
      schema: {
        steps: [
          {
            title: "Preferences",
            fields: [
              {
                kind: "single-choice",
                label: "Favorite color",
                options: ["Red", "Blue", "Green"],
              },
              {
                kind: "rating",
                label: "Satisfaction",
                max: 5,
              },
            ],
          },
        ],
      },
    });

    await flush();

    const host = getQuestionnaireHost(container);
    const frames = getFieldFrames(host);

    expect(frames.length).toBe(2);

    // single-choice field should render a radio group
    const singleChoiceShadow = getShadow(
      getShadow(frames[0]!).querySelector("mlf-single-choice-field") as HTMLElement,
    );
    expect(singleChoiceShadow.querySelector("[role='radiogroup']")).toBeTruthy();

    // rating field should render buttons
    const ratingShadow = getShadow(
      getShadow(frames[1]!).querySelector("mlf-rating-field") as HTMLElement,
    );
    const ratingButtons = ratingShadow.querySelectorAll(".rating-btn");
    expect(ratingButtons.length).toBe(5); // max=5, min=1

    mounted.unmount();
  });
});
