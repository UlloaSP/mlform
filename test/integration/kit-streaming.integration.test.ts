// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { describe, expect, it, vi } from "vite-plus/test";
import { mountForm } from "@/kit";
import { flush, getShadow } from "./kit-integration-helpers";

describe("kit integration", () => {
  it("renders stream progress while a submission is in flight", async () => {
    let resolveStream: (() => void) | undefined;

    const container = document.createElement("div");
    document.body.append(container);
    const mounted = mountForm(container, {
      transport: {
        submit: vi.fn(),
        async *stream() {
          yield { type: "progress", loaded: 1, total: 2 };
          await new Promise<void>((resolve) => {
            resolveStream = resolve;
          });
          yield {
            type: "result",
            result: {
              reports: [
                {
                  mappedTo: "risk",
                  prediction: "high",
                  labels: ["low", "high"],
                  probabilities: [0.2, 0.8],
                },
              ],
            },
          };
        },
      },
      schema: {
        fields: [{ kind: "text", label: "Name", required: true }],
        reports: [{ kind: "classifier", id: "risk", label: "Risk", mappedTo: "risk" }],
      },
      initialValues: {
        name: "Alice",
      },
    });

    const pendingSubmit = mounted.form.submit();
    await flush();

    const submitHost = getShadow(mounted.host).querySelector("mlf-submit-button");
    expect(getShadow(submitHost).textContent).toContain("50%");

    resolveStream?.();
    await pendingSubmit;
    await flush();

    expect(getShadow(submitHost).textContent).not.toContain("50%");

    mounted.unmount();
    container.remove();
  });

  it("renders session message counts while a session-backed submit is in flight", async () => {
    let resolveStream: (() => void) | undefined;

    const container = document.createElement("div");
    document.body.append(container);
    const mounted = mountForm(container, {
      transport: {
        submit: vi.fn(),
        async *stream() {
          yield {
            type: "chunk",
            chunk: {
              type: "token",
              data: "hello",
            },
            meta: {
              session: true,
              messageType: "token",
            },
          };
          await new Promise<void>((resolve) => {
            resolveStream = resolve;
          });
          yield {
            type: "result",
            result: {
              reports: [],
            },
          };
        },
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

    const submitHost = getShadow(mounted.host).querySelector("mlf-submit-button");
    expect(getShadow(submitHost).textContent).toContain("1 msgs");

    resolveStream?.();
    await pendingSubmit;

    mounted.unmount();
    container.remove();
  });

  it("renders incremental field and report stream updates before completion", async () => {
    let resolveStream: (() => void) | undefined;

    const container = document.createElement("div");
    document.body.append(container);
    const mounted = mountForm(container, {
      transport: {
        submit: vi.fn(),
        async *stream() {
          yield {
            type: "field-update",
            fieldId: "name",
            value: "Bob",
          } as const;
          yield {
            type: "report-replace",
            reportId: "risk",
            payload: {
              prediction: "streaming",
            },
          } as const;
          await new Promise<void>((resolve) => {
            resolveStream = resolve;
          });
          yield {
            type: "result",
            result: {
              reports: [{ mappedTo: "risk", prediction: "final" }],
            },
          } as const;
        },
      },
      schema: {
        fields: [{ id: "name", kind: "text", label: "Name", required: true, mappedTo: "name" }],
        reports: [{ kind: "classifier", id: "risk", label: "Risk", mappedTo: "risk" }],
      },
      initialValues: {
        name: "Alice",
      },
    });

    const pendingSubmit = mounted.form.submit();
    await flush();

    expect(mounted.form.getValues()).toEqual({ name: "Bob" });
    expect(mounted.form.getReport("risk")?.state.payload).toEqual({
      prediction: "streaming",
    });
    expect(getShadow(mounted.host).querySelector("mlf-report-frame")).not.toBeNull();

    resolveStream?.();
    await pendingSubmit;
    await flush();

    expect(mounted.form.getReport("risk")?.state.payload).toEqual({
      prediction: "final",
    });

    mounted.unmount();
    container.remove();
  });
});
