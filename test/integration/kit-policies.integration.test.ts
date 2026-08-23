// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { describe, expect, it, vi } from "vite-plus/test";
import { mountForm } from "@/kit";
import { flush, getShadow } from "./kit-integration-helpers";

describe("kit integration", () => {
  it("forwards report transport to built-in reports through the kit mount", async () => {
    const reportTransport = {
      submit: vi.fn().mockResolvedValue(["tree root", "leaf a", "leaf b"]),
    };
    const container = document.createElement("div");
    document.body.append(container);
    const mounted = mountForm(container, {
      transport: {
        submit: vi.fn().mockResolvedValue({
          reports: [
            {
              mappedTo: "risk",
              prediction: "high",
              labels: ["low", "high"],
              probabilities: [0.15, 0.85],
            },
          ],
        }),
      },
      reportTransport,
      schema: {
        fields: [{ kind: "text", id: "name", label: "Name", required: true, mappedTo: "name" }],
        reports: [
          {
            kind: "classifier",
            id: "risk",
            label: "Risk",
            mappedTo: "risk",
          },
        ],
      },
      initialValues: {
        name: "Alice",
      },
    });

    await mounted.form.submit();
    await flush();
    await flush();
    await flush();

    expect(reportTransport.submit).toHaveBeenCalledWith(
      expect.objectContaining({
        reportId: "risk",
        values: {
          name: "Alice",
        },
      }),
    );

    const reportFrame = getShadow(mounted.host).querySelector("mlf-report-frame");
    const reportRenderer = getShadow(reportFrame).querySelector("mlf-classifier-report");
    expect(getShadow(reportRenderer).textContent).toContain("tree root");

    mounted.unmount();
    container.remove();
  });

  it("rejects invalid transport configuration at mount time", () => {
    const container = document.createElement("div");

    expect(() =>
      mountForm(container, {
        transport: {} as never,
        schema: {
          fields: [{ kind: "text", label: "Name" }],
        },
      } as never),
    ).toThrow("createForm requires a transport with a submit(request) function.");
  });

  it("forwards reset-on-hide and listener error policies to the engine", async () => {
    const listenerErrors: unknown[] = [];
    const container = document.createElement("div");
    document.body.append(container);

    const mounted = mountForm(container, {
      transport: {
        submit: vi.fn().mockResolvedValue({ reports: [] }),
      },
      schema: {
        fields: [
          { kind: "boolean", label: "Advanced" },
          {
            kind: "text",
            label: "Secret",
            defaultValue: "initial-secret",
            hiddenWhen: ({ values }) => values.advanced !== true,
          },
        ],
      },
      inactiveFieldPolicy: "reset-on-hide",
      listenerErrorPolicy: "ignore",
      onListenerError(error) {
        listenerErrors.push(error);
      },
    });

    mounted.form.subscribe(() => {
      throw new Error("listener failed");
    });

    mounted.form.setValues({
      advanced: true,
      secret: "temporary-secret",
    });
    mounted.form.setValues({
      advanced: false,
    });

    expect(mounted.form.getValues()).toEqual({
      advanced: false,
      secret: "initial-secret",
    });
    expect(listenerErrors).toHaveLength(2);

    mounted.unmount();
    container.remove();
  });

  it("validates replaceDesignSystem at runtime for untyped consumers", async () => {
    const container = document.createElement("div");
    document.body.append(container);
    const mounted = mountForm(container, {
      transport: {
        submit: vi.fn().mockResolvedValue({ reports: [] }),
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
