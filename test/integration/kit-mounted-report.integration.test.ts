// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { describe, expect, it, vi } from "vite-plus/test";
import * as z from "zod";
import { createMlRegistryPack } from "@/builtins";
import { defineReportKind, mountForm, registerDefinedReportKind } from "@/kit";
import { resolveMappedReportPayload } from "@/schema";

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

describe("kit mounted report", () => {
  it("renders trusted DOM reports and cleans them up", async () => {
    const cleanup = vi.fn();
    const pack = createMlRegistryPack();

    registerDefinedReportKind(
      pack.registry,
      pack.descriptorRegistry,
      defineReportKind({
        kind: "dom-report",
        schema: z.object({
          kind: z.literal("dom-report"),
          id: z.string().optional(),
          label: z.string().optional(),
          mappedTo: z.string(),
        }),
        resolve: ({ report, result }) => resolveMappedReportPayload(report, result),
        render: {
          mount: ({ element, payload }) => {
            const text = (payload as { text?: string } | undefined)?.text ?? "";
            const output = document.createElement("strong");
            output.textContent = text;
            element.replaceChildren(output);
            return cleanup;
          },
        },
      }),
    );

    const submit = vi
      .fn()
      .mockResolvedValueOnce({ reports: [{ mappedTo: "summary", text: "first" }] })
      .mockResolvedValueOnce({ reports: [{ mappedTo: "summary", text: "second" }] });
    const container = document.createElement("div");
    document.body.append(container);

    const mounted = mountForm(container, {
      registry: pack.registry,
      descriptorRegistry: pack.descriptorRegistry,
      transport: { submit },
      schema: {
        fields: [{ kind: "text", id: "name", label: "Name", mappedTo: "name" }],
        reports: [{ kind: "dom-report", id: "summary", label: "Summary", mappedTo: "summary" }],
      },
      initialValues: { name: "Alice" },
    });

    await mounted.form.submit();
    await flush();

    let renderer = getShadow(
      getShadow(mounted.host).querySelector("mlf-report-frame"),
    ).querySelector("mlf-mounted-report");
    expect(getShadow(renderer).textContent).toContain("first");
    expect(cleanup).not.toHaveBeenCalled();

    await mounted.form.submit();
    await flush();

    renderer = getShadow(getShadow(mounted.host).querySelector("mlf-report-frame")).querySelector(
      "mlf-mounted-report",
    );
    expect(getShadow(renderer).textContent).toContain("second");
    expect(cleanup).toHaveBeenCalled();

    const beforeUnmount = cleanup.mock.calls.length;
    mounted.unmount();
    expect(cleanup).toHaveBeenCalledTimes(beforeUnmount + 1);
    container.remove();
  });

  it("isolates mount render failures", async () => {
    const pack = createMlRegistryPack();

    registerDefinedReportKind(
      pack.registry,
      pack.descriptorRegistry,
      defineReportKind({
        kind: "broken-dom-report",
        schema: z.object({
          kind: z.literal("broken-dom-report"),
          id: z.string().optional(),
          label: z.string().optional(),
          mappedTo: z.string(),
        }),
        resolve: ({ report, result }) => resolveMappedReportPayload(report, result),
        render: {
          mount: () => {
            throw new Error("boom");
          },
        },
      }),
    );

    const container = document.createElement("div");
    document.body.append(container);

    const mounted = mountForm(container, {
      registry: pack.registry,
      descriptorRegistry: pack.descriptorRegistry,
      transport: { submit: vi.fn().mockResolvedValue({ reports: [{ mappedTo: "broken" }] }) },
      schema: {
        fields: [],
        reports: [
          {
            kind: "broken-dom-report",
            id: "broken",
            label: "Broken",
            mappedTo: "broken",
          },
        ],
      },
    });

    await mounted.form.submit();
    await flush();

    const renderer = getShadow(
      getShadow(mounted.host).querySelector("mlf-report-frame"),
    ).querySelector("mlf-mounted-report");
    expect(getShadow(renderer).textContent).toContain("Report render failed: boom");

    mounted.unmount();
    container.remove();
  });
});
