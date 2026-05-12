// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { describe, expect, it, vi } from "vite-plus/test";
import { mountForm } from "@/kit";

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

const mountFieldFrame = async (showDescriptionInline?: boolean) => {
  const container = document.createElement("div");
  document.body.append(container);
  const mounted = mountForm(container, {
    schema: {
      fields: [
        {
          id: "email",
          kind: "text",
          label: "Email",
          description: "Used for notifications.",
          showDescriptionInline,
        },
      ],
    },
    transport: { submit: vi.fn().mockResolvedValue({ reports: {} }) },
  });
  await flush();
  const frame = getShadow(mounted.host).querySelector("mlf-field-frame") as HTMLElement;

  return { container, frame, mounted };
};

describe("field description visibility", () => {
  it("keeps field descriptions hidden by default until help is pressed", async () => {
    const { container, mounted, frame } = await mountFieldFrame();
    const shadow = getShadow(frame);
    const description = shadow.querySelector(".description");
    const help = shadow.querySelector(".help-btn") as HTMLButtonElement;

    expect(description?.classList.contains("show")).toBe(false);
    expect(help.getAttribute("aria-expanded")).toBe("false");

    mounted.unmount();
    container.remove();
  });

  it("shows field descriptions inline when showDescriptionInline is true", async () => {
    const { container, mounted, frame } = await mountFieldFrame(true);
    const shadow = getShadow(frame);
    const description = shadow.querySelector(".description");
    const help = shadow.querySelector(".help-btn") as HTMLButtonElement;

    expect(description?.classList.contains("show")).toBe(true);
    expect(help.getAttribute("aria-expanded")).toBe("true");

    help.click();
    await flush();

    expect(description?.classList.contains("show")).toBe(false);
    expect(help.getAttribute("aria-expanded")).toBe("false");

    mounted.unmount();
    container.remove();
  });
});
