// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { describe, expect, it, vi } from "vite-plus/test";
import * as z from "zod";
import { createMlRegistryPack } from "@/builtins";
import { defineReportKind, mountForm, registerDefinedReportKind } from "@/kit";

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

const createPack = (fetchReport: () => Promise<unknown>) => {
  const pack = createMlRegistryPack();

  registerDefinedReportKind(
    pack.registry,
    pack.descriptorRegistry,
    defineReportKind({
      kind: "async-summary",
      schema: z.object({
        kind: z.literal("async-summary"),
        id: z.string().optional(),
        label: z.string().optional(),
      }),
      fetch: () => ({ submit: fetchReport }),
      resolve: () => undefined,
      render: {
        content: ({ payload }) => ({
          type: "json",
          label: "Async",
          value: payload,
        }),
      },
    }),
  );

  return pack;
};

const clickSubmit = (host: HTMLElement): void => {
  const submitHost = getShadow(host).querySelector("mlf-submit-button");
  const button = getShadow(submitHost).querySelector("button");
  button?.dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true }));
};

describe("kit reportFetchMode", () => {
  it("waits for async report fetches before submit success when mode is all", async () => {
    let resolveFetch: ((value: unknown) => void) | undefined;
    const fetchReport = vi.fn(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve;
        }),
    );
    const pack = createPack(fetchReport);
    const container = document.createElement("div");
    document.body.append(container);

    const mounted = mountForm(container, {
      registry: pack.registry,
      descriptorRegistry: pack.descriptorRegistry,
      reportFetchMode: "all",
      transport: { submit: vi.fn().mockResolvedValue({ reports: [] }) },
      schema: {
        fields: [{ kind: "text", id: "name", label: "Name", mappedTo: "name" }],
        reports: [{ kind: "async-summary", id: "summary", label: "Summary" }],
      },
      initialValues: { name: "Alice" },
    });

    await flush();

    let settled = false;
    const success = new Promise<CustomEvent>((resolve) => {
      mounted.host.addEventListener(
        "mlf-submit-success",
        (event) => {
          settled = true;
          resolve(event as CustomEvent);
        },
        { once: true },
      );
    });

    clickSubmit(mounted.host);
    await flush();

    expect(fetchReport).toHaveBeenCalledTimes(1);
    expect(settled).toBe(false);

    resolveFetch?.({ rows: [1] });
    const event = await success;

    expect(event.detail.pipelineResult.reportFetchResults).toEqual({
      summary: { rows: [1] },
    });
    expect(mounted.form.getReport("summary")?.state.status).toBe("ready");

    mounted.unmount();
    container.remove();
  });

  it("does not fetch async reports when mode is none", async () => {
    const fetchReport = vi.fn().mockResolvedValue({ rows: [1] });
    const pack = createPack(fetchReport);
    const container = document.createElement("div");
    document.body.append(container);

    const mounted = mountForm(container, {
      registry: pack.registry,
      descriptorRegistry: pack.descriptorRegistry,
      reportFetchMode: "none",
      transport: { submit: vi.fn().mockResolvedValue({ reports: [] }) },
      schema: {
        fields: [{ kind: "text", id: "name", label: "Name", mappedTo: "name" }],
        reports: [{ kind: "async-summary", id: "summary", label: "Summary" }],
      },
      initialValues: { name: "Alice" },
    });

    await flush();

    const success = new Promise<CustomEvent>((resolve) => {
      mounted.host.addEventListener(
        "mlf-submit-success",
        (event) => resolve(event as CustomEvent),
        {
          once: true,
        },
      );
    });

    clickSubmit(mounted.host);
    const event = await success;
    await flush();
    await flush();

    expect(fetchReport).not.toHaveBeenCalled();
    expect(event.detail.pipelineResult.reportFetchResults).toEqual({});
    expect(mounted.form.getReport("summary")?.state.status).toBe("idle");

    mounted.unmount();
    container.remove();
  });
});
