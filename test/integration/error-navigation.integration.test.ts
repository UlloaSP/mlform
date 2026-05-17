// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { describe, expect, it, vi } from "vite-plus/test";
import { mountAccordionForm, mountTabsForm, mountWizardForm } from "@/kit";
import { createMlRegistryPack } from "@/builtins-ml";
import { createForm } from "@/runtime";
import { mountForm } from "@/primitives";

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

const installScrollSpy = () => {
  if (!HTMLElement.prototype.scrollIntoView) {
    HTMLElement.prototype.scrollIntoView = vi.fn();
  }
  return vi.spyOn(HTMLElement.prototype, "scrollIntoView");
};

describe("error navigation", () => {
  it("scrolls the first invalid field in stacked primitive forms", async () => {
    const scrollSpy = installScrollSpy();
    const form = createForm({
      schema: {
        fields: [{ id: "name", kind: "text", label: "Name", required: true }],
      },
      registry: createMlRegistryPack().registry,
      transport: { submit: vi.fn() },
    });
    const container = document.createElement("div");
    document.body.append(container);
    const mounted = mountForm(container, form);

    await flush();
    const submitHost = getShadow(mounted.host).querySelector("mlf-submit-button");
    getShadow(submitHost)
      .querySelector("button")
      ?.dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true }));

    await flush();
    await flush();

    expect(form.getField("name")?.state.errors).toEqual(["This field is required."]);
    expect(scrollSpy).toHaveBeenCalled();

    scrollSpy.mockRestore();
    mounted.unmount();
    container.remove();
  });

  it("returns to the first invalid wizard step and scrolls its field", async () => {
    const scrollSpy = installScrollSpy();
    const container = document.createElement("div");
    document.body.append(container);

    const mounted = mountWizardForm(container, {
      transport: { submit: vi.fn().mockResolvedValue({ reports: {} }) },
      schema: {
        fields: [
          { id: "name", kind: "text", label: "Name", required: true },
          { id: "age", kind: "number", label: "Age", required: true },
        ],
      },
      layout: {
        kind: "wizard",
        steps: [
          { title: "Profile", children: [{ kind: "field", field: "name" }] },
          { title: "Details", children: [{ kind: "field", field: "age" }] },
        ],
      },
    });

    await flush();
    mounted.form.getField("name")?.setValue("Alice");
    await flush();

    (getShadow(mounted.host).querySelector(".btn-next") as HTMLButtonElement).click();
    await flush();
    mounted.form.getField("name")?.setValue("");
    mounted.form.getField("age")?.setValue(42);
    await flush();

    (getShadow(mounted.host).querySelector(".btn-submit") as HTMLButtonElement).click();
    await flush();
    await flush();

    expect(getShadow(mounted.host).textContent).toContain("Profile");
    expect(
      getShadow(mounted.host).querySelector("mlf-field-frame")?.getAttribute("data-field-id"),
    ).toBe("name");
    expect(scrollSpy).toHaveBeenCalled();

    scrollSpy.mockRestore();
    mounted.unmount();
    container.remove();
  });

  it("switches to the first invalid tab and scrolls its field", async () => {
    const scrollSpy = installScrollSpy();
    const container = document.createElement("div");
    document.body.append(container);

    const mounted = mountTabsForm(container, {
      transport: { submit: vi.fn().mockResolvedValue({ reports: {} }) },
      schema: {
        fields: [
          { id: "name", kind: "text", label: "Name", required: true },
          { id: "age", kind: "number", label: "Age", required: true },
        ],
      },
      layout: {
        kind: "tabs",
        tabs: [
          { title: "Profile", children: [{ kind: "field", field: "name" }] },
          { title: "Details", children: [{ kind: "field", field: "age" }] },
        ],
      },
    });

    await flush();
    (getShadow(mounted.host).querySelectorAll(".tab").item(1) as HTMLButtonElement).click();
    mounted.form.getField("age")?.setValue(42);
    await flush();

    (getShadow(mounted.host).querySelector(".btn-submit") as HTMLButtonElement).click();
    await flush();
    await flush();

    expect(getShadow(mounted.host).querySelector('[aria-selected="true"]')?.textContent).toContain(
      "Profile",
    );
    expect(scrollSpy).toHaveBeenCalled();

    scrollSpy.mockRestore();
    mounted.unmount();
    container.remove();
  });

  it("opens the first invalid accordion section and scrolls its field", async () => {
    const scrollSpy = installScrollSpy();
    const container = document.createElement("div");
    document.body.append(container);

    const mounted = mountAccordionForm(container, {
      transport: { submit: vi.fn().mockResolvedValue({ reports: {} }) },
      schema: {
        fields: [
          { id: "name", kind: "text", label: "Name", required: true },
          { id: "age", kind: "number", label: "Age", required: true },
        ],
      },
      layout: {
        kind: "accordion",
        sections: [
          { title: "Profile", children: [{ kind: "field", field: "name" }] },
          { title: "Details", children: [{ kind: "field", field: "age" }] },
        ],
      },
    });

    await flush();
    const toggles = getShadow(mounted.host).querySelectorAll(".section-toggle");
    (toggles.item(0) as HTMLButtonElement).click();
    (toggles.item(1) as HTMLButtonElement).click();
    mounted.form.getField("age")?.setValue(42);
    await flush();

    (getShadow(mounted.host).querySelector(".btn-submit") as HTMLButtonElement).click();
    await flush();
    await flush();

    const updatedToggles = getShadow(mounted.host).querySelectorAll(".section-toggle");
    expect(updatedToggles.item(0).getAttribute("aria-expanded")).toBe("true");
    expect(scrollSpy).toHaveBeenCalled();

    scrollSpy.mockRestore();
    mounted.unmount();
    container.remove();
  });
});
