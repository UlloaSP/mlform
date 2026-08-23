// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { describe, expect, it, vi } from "vite-plus/test";
import { mountForm } from "@/kit";
import { SubmissionAbortedError } from "@/runtime";
import { flush } from "./kit-integration-helpers";

describe("kit integration", () => {
  it("auto-unmounts an existing mounted form when reusing the same container", async () => {
    window.__setPreferredColorScheme?.("light");

    const container = document.createElement("div");
    document.body.append(container);
    const firstChanges = vi.fn();
    const secondChanges = vi.fn();

    const first = mountForm(container, {
      transport: {
        submit: vi.fn().mockResolvedValue({ reports: [] }),
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
        submit: vi.fn().mockResolvedValue({ reports: [] }),
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

  it("restores replaced container content on unmount when replacement is explicit", async () => {
    const container = document.createElement("div");
    const placeholder = document.createElement("section");
    placeholder.textContent = "dashboard";
    container.append(placeholder);
    document.body.append(container);

    const mounted = mountForm(container, {
      transport: {
        submit: vi.fn().mockResolvedValue({ reports: [] }),
      },
      schema: {
        fields: [{ kind: "text", label: "Name" }],
      },
      containerStrategy: "replace",
    });

    await flush();

    expect(container.firstElementChild).toBe(mounted.host);

    mounted.unmount();

    expect(container.childElementCount).toBe(1);
    expect(container.firstElementChild).toBe(placeholder);
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

    resolveTransport?.({ reports: [] });
    rejectTransport?.();
  });
});
