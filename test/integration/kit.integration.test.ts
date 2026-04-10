// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { describe, expect, it, vi } from "vite-plus/test";
import { SubmissionAbortedError } from "@/engine";
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

const getFieldControlHost = (host: HTMLElement, index: number): HTMLElement => {
  const fieldFrame = getShadow(host).querySelectorAll("mlf-field-frame").item(index) as HTMLElement;
  const fieldShadow = getShadow(fieldFrame);
  const renderer = fieldShadow.querySelector(
    "mlf-text-field, mlf-number-field, mlf-boolean-field, mlf-category-field, mlf-date-field, mlf-time-series-field",
  );
  return getShadow(renderer).querySelector("[aria-label]") as HTMLElement;
};

describe("kit integration", () => {
  it("mounts a default form, submits through the endpoint transport, and applies the design system", async () => {
    const json = vi.fn().mockResolvedValue({
      reports: {
        risk: {
          prediction: "high",
          labels: ["low", "high"],
          probabilities: [0.1, 0.9],
        },
      },
    });
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      headers: new Headers({
        "content-type": "application/json",
      }),
      json,
      text: vi.fn(),
    });
    const container = document.createElement("div");
    document.body.append(container);
    const mounted = mountForm(container, {
      endpoint: "https://api.example.com/predict",
      transportOptions: {
        fetch: fetchMock as typeof globalThis.fetch,
      },
      schema: {
        fields: [
          {
            kind: "text",
            label: "Name",
            required: true,
          },
        ],
        reports: [
          {
            kind: "classifier",
            id: "risk",
            label: "Risk",
          },
        ],
      },
      labels: {
        form: "Profile",
        submit: "Predict",
      },
      designSystem: {
        theme: "cobalt",
        recipe: "minimal",
      },
    });

    await flush();

    expect(mounted.host.getAttribute("theme-id")).toBe("cobalt");
    expect(mounted.host.getAttribute("recipe-id")).toBe("minimal");
    expect(getShadow(mounted.host).textContent).toContain("Profile");

    const textInput = getFieldControlHost(mounted.host, 0) as HTMLInputElement;
    textInput.value = "Alice";
    textInput.dispatchEvent(new Event("input", { bubbles: true, composed: true }));

    await flush();

    const submitHost = getShadow(mounted.host).querySelector("mlf-submit-button");
    const submitButton = getShadow(submitHost).querySelector("button");
    submitButton?.dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true }));

    await flush();
    await flush();

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.com/predict",
      expect.objectContaining({
        body: JSON.stringify({
          inputs: {
            name: "Alice",
          },
        }),
      }),
    );

    const reportFrame = getShadow(mounted.host).querySelector("mlf-report-frame");
    const reportRenderer = getShadow(reportFrame).querySelector("mlf-classifier-report");
    expect(getShadow(reportRenderer).textContent).toContain("high");

    mounted.updateDesignSystem({
      theme: "sunset",
    });

    await flush();

    expect(mounted.host.getAttribute("theme-id")).toBe("sunset");

    mounted.replaceDesignSystem({
      mode: "auto",
      theme: "neutral",
      recipe: "default",
    });

    await flush();

    expect(mounted.host.getAttribute("theme-id")).toBe("neutral");
    expect(mounted.host.getAttribute("recipe-id")).toBe("default");

    mounted.resetDesignSystem();

    await flush();

    expect(mounted.host.getAttribute("theme-id")).toBe("cobalt");
    expect(mounted.host.getAttribute("recipe-id")).toBe("minimal");

    mounted.unmount();
    expect(container.childElementCount).toBe(0);
    container.remove();
  });

  it("auto-unmounts an existing mounted form when reusing the same container", async () => {
    window.__setPreferredColorScheme?.("light");

    const container = document.createElement("div");
    document.body.append(container);
    const firstChanges = vi.fn();
    const secondChanges = vi.fn();

    const first = mountForm(container, {
      transport: {
        submit: vi.fn().mockResolvedValue({ reports: {} }),
      },
      schema: {
        fields: [{ kind: "text", label: "Name" }],
      },
      designSystem: {
        mode: "auto",
        theme: "cobalt",
        recipe: "minimal",
      },
      onDesignSystemChange: firstChanges,
    });

    await flush();

    expect(firstChanges).toHaveBeenCalledTimes(1);
    const firstHost = first.host;

    const second = mountForm(container, {
      transport: {
        submit: vi.fn().mockResolvedValue({ reports: {} }),
      },
      schema: {
        fields: [{ kind: "text", label: "Email" }],
      },
      designSystem: {
        mode: "auto",
        theme: "sunset",
        recipe: "soft",
      },
      onDesignSystemChange: secondChanges,
    });

    await flush();

    expect(container.childElementCount).toBe(1);
    expect(container.firstElementChild).toBe(second.host);
    expect(first.host.isConnected).toBe(false);
    expect(secondChanges).toHaveBeenCalledTimes(1);

    first.unmount();

    expect(container.firstElementChild).toBe(second.host);

    window.__setPreferredColorScheme?.("dark");
    await flush();
    await flush();

    expect(firstChanges).toHaveBeenCalledTimes(1);
    expect(first.designSystem.resolved).toBeNull();
    expect(second.designSystem.resolved?.effectiveScheme).toBe("dark");
    expect(firstHost.isConnected).toBe(false);

    second.unmount();
    container.remove();
  });

  it("aborts in-flight submissions when the mounted form is unmounted", async () => {
    let resolveTransport: ((value: unknown) => void) | undefined;
    let rejectTransport: ((reason?: unknown) => void) | undefined;
    let observedSignal: AbortSignal | undefined;

    const mounted = mountForm(document.createElement("div"), {
      transport: {
        submit: vi.fn().mockImplementation(
          ({ signal }: { signal?: AbortSignal }) =>
            new Promise((resolve, reject) => {
              observedSignal = signal;
              resolveTransport = resolve;
              rejectTransport = reject;
              signal?.addEventListener(
                "abort",
                () => {
                  reject(new Error("transport aborted"));
                },
                { once: true },
              );
            }),
        ),
      },
      schema: {
        fields: [{ kind: "text", label: "Name", required: true }],
      },
      initialValues: {
        name: "Alice",
      },
    });

    const pendingSubmit = mounted.form.submit();

    await flush();

    mounted.unmount();

    expect(observedSignal?.aborted).toBe(true);
    await expect(pendingSubmit).rejects.toBeInstanceOf(SubmissionAbortedError);

    resolveTransport?.({ reports: {} });
    rejectTransport?.();
  });

  it("rejects conflicting transport configuration at mount time", () => {
    const container = document.createElement("div");

    expect(() =>
      mountForm(container, {
        endpoint: "https://api.example.com/predict",
        transport: {
          submit: vi.fn(),
        },
        schema: {
          fields: [{ kind: "text", label: "Name" }],
        },
      }),
    ).toThrow("Provide either transport or endpoint/transportOptions");
  });

  it("validates replaceDesignSystem at runtime for untyped consumers", async () => {
    const container = document.createElement("div");
    document.body.append(container);
    const mounted = mountForm(container, {
      transport: {
        submit: vi.fn().mockResolvedValue({ reports: {} }),
      },
      schema: {
        fields: [{ kind: "text", label: "Name" }],
      },
    });

    await flush();

    expect(() =>
      mounted.replaceDesignSystem({
        theme: "cobalt",
      } as never),
    ).toThrow("replaceDesignSystem requires an explicit mode, theme, and recipe.");

    mounted.unmount();
    container.remove();
  });
});
