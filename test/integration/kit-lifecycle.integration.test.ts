// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { describe, expect, it, vi } from "vite-plus/test";
import { mountForm } from "@/kit";
import { SubmissionAbortedError } from "@/runtime";
import { flush } from "./kit-integration-helpers";

describe("kit integration", () => {
  it("applies container replacement rules to explicit layouts", () => {
    const container = document.createElement("div");
    const previous = document.createElement("p");
    previous.textContent = "Existing content";
    container.append(previous);
    const options = {
      transport: { submit: vi.fn().mockResolvedValue({ reports: [] }) },
      schema: { fields: [{ id: "name", kind: "text", label: "Name" }] },
      layout: {
        kind: "stacked" as const,
        children: [
          {
            kind: "section" as const,
            title: "Details",
            children: [{ kind: "field" as const, field: "name" }],
          },
        ],
      },
    };

    expect(() => mountForm(container, options)).toThrow(
      'Mount into an empty container or pass `containerStrategy: "replace"`.',
    );
    expect(container.firstChild).toBe(previous);

    const mounted = mountForm(container, { ...options, containerStrategy: "replace" });
    expect(container.firstChild).toBe(mounted.host);
    mounted.unmount();
    expect(container.firstChild).toBe(previous);
  });

  it("keeps the previous mount when a replacement layout is invalid", () => {
    const container = document.createElement("div");
    const transport = { submit: vi.fn().mockResolvedValue({ reports: [] }) };
    const first = mountForm(container, {
      transport,
      schema: { fields: [{ id: "name", kind: "text", label: "Name" }] },
    });

    expect(() =>
      mountForm(container, {
        transport,
        schema: { fields: [{ id: "name", kind: "text", label: "Name" }] },
        layout: { kind: "stacked", children: [{ kind: "field", field: "missing" }] },
      }),
    ).toThrow('Layout references unknown field "missing".');

    expect(container.firstChild).toBe(first.host);
    expect(first.form.state.lifecycle).toBe("active");
    first.unmount();
  });

  it.each(["stacked", "tabs"] as const)(
    "keeps the previous mount when %s host setup fails",
    (kind) => {
      const container = document.createElement("div");
      const transport = { submit: vi.fn().mockResolvedValue({ reports: [] }) };
      const schema = { fields: [{ id: "name", kind: "text", label: "Name" }] };
      const first = mountForm(container, { transport, schema });
      const failure = new Error("design callback failed");

      expect(() =>
        mountForm(container, {
          transport,
          schema,
          layout:
            kind === "tabs"
              ? {
                  kind: "tabs",
                  tabs: [{ title: "Main", children: [{ kind: "field", field: "name" }] }],
                }
              : { kind: "stacked" },
          onDesignSystemChange: () => {
            throw failure;
          },
        }),
      ).toThrow(failure);

      expect(container.childElementCount).toBe(1);
      expect(container.firstElementChild).toBe(first.host);
      expect(first.form.state.lifecycle).toBe("active");

      const replacement = mountForm(container, { transport, schema });
      expect(container.firstElementChild).toBe(replacement.host);
      expect(first.form.state.lifecycle).toBe("disposed");
      replacement.unmount();
    },
  );

  it("keeps replaced content across successive mounts", () => {
    const container = document.createElement("div");
    const placeholder = document.createElement("p");
    container.append(placeholder);
    const options = {
      transport: { submit: vi.fn().mockResolvedValue({ reports: [] }) },
      schema: { fields: [{ id: "name", kind: "text", label: "Name" }] },
    };

    const first = mountForm(container, { ...options, containerStrategy: "replace" });
    const second = mountForm(container, options);
    expect(container.firstElementChild).toBe(second.host);
    expect(first.form.state.lifecycle).toBe("disposed");

    second.unmount();
    expect(container.firstElementChild).toBe(placeholder);
  });

  it("resubscribes a layout host after it reconnects", async () => {
    const container = document.createElement("div");
    document.body.append(container);
    const mounted = mountForm(container, {
      transport: { submit: vi.fn().mockResolvedValue({ reports: [] }) },
      schema: {
        fields: [
          { id: "name", kind: "text", label: "Name" },
          { id: "email", kind: "text", label: "Email" },
        ],
      },
      layout: {
        kind: "tabs",
        tabs: [
          { id: "first", title: "First", children: [{ kind: "field", field: "name" }] },
          { id: "second", title: "Second", children: [{ kind: "field", field: "email" }] },
        ],
      },
    });

    try {
      await vi.waitFor(() =>
        expect(mounted.host.shadowRoot?.querySelectorAll('[role="tab"]').length).toBe(2),
      );
      mounted.host.remove();
      container.append(mounted.host);
      const secondTab = mounted.host.shadowRoot?.querySelectorAll('[role="tab"]')[1];
      if (!(secondTab instanceof HTMLButtonElement)) throw new Error("Missing second tab");
      secondTab.click();
      await vi.waitFor(() =>
        expect(mounted.host.shadowRoot?.querySelector('[role="tabpanel"]:not([hidden])')?.id).toBe(
          "panel-second",
        ),
      );
    } finally {
      mounted.unmount();
      container.remove();
    }
  });

  it("can follow document visibility and disables the rendered form while suspended", async () => {
    const visibility = Object.getOwnPropertyDescriptor(document, "visibilityState");
    const setVisibility = (value: DocumentVisibilityState) => {
      Object.defineProperty(document, "visibilityState", { configurable: true, value });
      document.dispatchEvent(new Event("visibilitychange"));
    };
    const container = document.createElement("div");
    document.body.append(container);
    const mounted = mountForm(container, {
      transport: { submit: vi.fn().mockResolvedValue({ reports: [] }) },
      schema: { fields: [{ kind: "text", label: "Name" }] },
      hostLifecycle: "document",
    });

    try {
      setVisibility("hidden");
      await flush();
      expect(mounted.form.state.lifecycle).toBe("suspended");
      expect(mounted.host.shadowRoot?.querySelector(".root")?.hasAttribute("inert")).toBe(true);

      setVisibility("visible");
      await flush();
      expect(mounted.form.state.lifecycle).toBe("active");
      expect(mounted.host.shadowRoot?.querySelector(".root")?.hasAttribute("inert")).toBe(false);

      window.dispatchEvent(new Event("pagehide"));
      expect(mounted.form.state.lifecycle).toBe("suspended");
      window.dispatchEvent(new Event("pageshow"));
      expect(mounted.form.state.lifecycle).toBe("active");
    } finally {
      mounted.unmount();
      container.remove();
      if (visibility) Object.defineProperty(document, "visibilityState", visibility);
    }
  });

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
