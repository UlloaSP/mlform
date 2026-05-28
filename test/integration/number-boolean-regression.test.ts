// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { describe, expect, it, vi } from "vite-plus/test";
import { createMlRegistryPack } from "@/builtins";
import { mountForm as mountPrimitiveForm } from "@/primitives";
import { createForm } from "@/runtime";

const mountForm: typeof mountPrimitiveForm = (container, form, options) =>
  mountPrimitiveForm(container, form, {
    descriptorRegistry: createMlRegistryPack().descriptorRegistry,
    ...options,
  });

const flush = async (): Promise<void> => {
  await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));
  await Promise.resolve();
};

const shadow = (element: Element | null): ShadowRoot => {
  if (!(element instanceof HTMLElement) || !element.shadowRoot) {
    throw new Error("Expected element with shadow root.");
  }

  return element.shadowRoot;
};

describe("number and boolean regressions", () => {
  it("renders normalized numeric state in number controls", async () => {
    const form = createForm({
      schema: {
        fields: [{ kind: "number", id: "epochs", label: "Epochs", required: true }],
      },
      registry: createMlRegistryPack().registry,
      initialValues: { epochs: "42" },
      transport: { submit: vi.fn() },
    });
    const container = document.createElement("div");
    document.body.append(container);
    const mounted = mountForm(container, form);

    await flush();

    const frame = shadow(mounted.host).querySelector("mlf-field-frame");
    const renderer = shadow(frame).querySelector("mlf-number-field");
    const input = shadow(renderer).querySelector("input") as HTMLInputElement;

    expect(form.getField("epochs")?.state.value).toBe(42);
    expect(input.value).toBe("42");

    mounted.unmount();
    container.remove();
  });

  it("keeps edited numeric values visible after blur", async () => {
    const form = createForm({
      schema: {
        fields: [{ kind: "number", id: "epochs", label: "Epochs", required: true }],
      },
      registry: createMlRegistryPack().registry,
      transport: { submit: vi.fn() },
    });
    const container = document.createElement("div");
    document.body.append(container);
    const mounted = mountForm(container, form);

    await flush();

    const frame = shadow(mounted.host).querySelector("mlf-field-frame");
    const renderer = shadow(frame).querySelector("mlf-number-field");
    const input = shadow(renderer).querySelector("input") as HTMLInputElement;

    input.dispatchEvent(new Event("focus", { bubbles: true, composed: true }));
    input.value = "1";
    input.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
    input.dispatchEvent(new Event("blur", { bubbles: true, composed: true }));
    await flush();
    await flush();

    expect(form.getField("epochs")?.state.value).toBe(1);
    expect(input.value).toBe("1");
    expect(shadow(frame).textContent).toContain("Valid number: 1.");

    mounted.unmount();
    container.remove();
  });

  it("keeps later edited numeric fields visible while the form is already editing", async () => {
    const form = createForm({
      schema: {
        fields: [
          { kind: "number", id: "first", label: "First", required: true },
          { kind: "number", id: "second", label: "Second", required: true },
        ],
      },
      registry: createMlRegistryPack().registry,
      transport: { submit: vi.fn() },
    });
    const container = document.createElement("div");
    document.body.append(container);
    const mounted = mountForm(container, form);

    await flush();

    const frames = shadow(mounted.host).querySelectorAll("mlf-field-frame");
    const firstRenderer = shadow(frames.item(0)).querySelector("mlf-number-field");
    const secondRenderer = shadow(frames.item(1)).querySelector("mlf-number-field");
    const firstInput = shadow(firstRenderer).querySelector("input") as HTMLInputElement;
    const secondInput = shadow(secondRenderer).querySelector("input") as HTMLInputElement;

    firstInput.value = "1";
    firstInput.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
    firstInput.dispatchEvent(new Event("blur", { bubbles: true, composed: true }));
    await flush();

    secondInput.value = "1";
    secondInput.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
    secondInput.dispatchEvent(new Event("blur", { bubbles: true, composed: true }));
    await flush();
    await flush();

    const refreshedSecondRenderer = shadow(frames.item(1)).querySelector("mlf-number-field") as
      | (HTMLElement & { descriptor?: { props?: Record<string, unknown> } })
      | null;

    expect(form.getField("second")?.state.value).toBe(1);
    expect(refreshedSecondRenderer?.descriptor?.props?.value).toBe(1);
    expect(secondInput.value).toBe("1");
    expect(shadow(frames.item(1)).textContent).toContain("Valid number: 1.");

    mounted.unmount();
    container.remove();
  });

  it("treats false as a present value for required boolean fields", async () => {
    const form = createForm({
      schema: {
        fields: [{ kind: "boolean", id: "enabled", label: "Enabled", required: true }],
      },
      registry: createMlRegistryPack().registry,
      initialValues: { enabled: false },
      transport: { submit: vi.fn() },
    });

    await form.validate();

    expect(form.getField("enabled")?.state.value).toBe(false);
    expect(form.getField("enabled")?.state.errors).toEqual([]);
  });
});
