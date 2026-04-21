// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { describe, expect, it, vi } from "vite-plus/test";
import * as z from "zod";
import {
  SubmissionAbortedError,
  createBuiltinRegistry,
  defineExplanationDefinition,
  defineExplanationKind,
  defineFieldKind,
  defineReportKind,
} from "@/engine";
import { createJsonTransport, createRoutingTransport, mountForm } from "@/kit";

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

const getDeclarativeFieldControlHost = (host: HTMLElement, index: number): HTMLElement => {
  const fieldFrame = getShadow(host).querySelectorAll("mlf-field-frame").item(index) as HTMLElement;
  const renderer = getShadow(fieldFrame).querySelector("mlf-declarative-field") as HTMLElement;
  const rendererShadow = getShadow(renderer);
  const builtinRenderer = rendererShadow.querySelector(
    "mlf-text-field, mlf-number-field, mlf-boolean-field, mlf-category-field, mlf-date-field, mlf-time-series-field",
  ) as HTMLElement;
  return getShadow(builtinRenderer).querySelector("[aria-label]") as HTMLElement;
};

describe("kit integration", () => {
  it("rejects mounting into a non-empty container unless replacement is explicit", () => {
    const container = document.createElement("div");
    container.append(document.createElement("span"));

    expect(() =>
      mountForm(container, {
        transport: {
          submit: vi.fn().mockResolvedValue({ reports: {} }),
        },
        schema: {
          fields: [{ kind: "text", label: "Name" }],
        },
      }),
    ).toThrow('Mount into an empty container or pass `containerStrategy: "replace"`.');
  });

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
      transport: createJsonTransport({
        endpoint: "https://api.example.com/predict",
        fetch: fetchMock as typeof globalThis.fetch,
      }),
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

    expect(mounted.host.getAttribute("data-mlf-theme-id")).toBe("cobalt");
    expect(mounted.host.getAttribute("data-mlf-recipe-id")).toBe("minimal");
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

    expect(mounted.host.getAttribute("data-mlf-theme-id")).toBe("sunset");

    mounted.replaceDesignSystem({
      mode: "auto",
      theme: "neutral",
      recipe: "default",
    });

    await flush();

    expect(mounted.host.getAttribute("data-mlf-theme-id")).toBe("neutral");
    expect(mounted.host.getAttribute("data-mlf-recipe-id")).toBe("default");

    mounted.resetDesignSystem();

    await flush();

    expect(mounted.host.getAttribute("data-mlf-theme-id")).toBe("cobalt");
    expect(mounted.host.getAttribute("data-mlf-recipe-id")).toBe("minimal");

    mounted.unmount();
    expect(container.childElementCount).toBe(0);
    container.remove();
  });

  it("routes mounted submissions through a composed transport", async () => {
    const localSubmit = vi.fn().mockResolvedValue({
      reports: {
        risk: {
          prediction: "local",
          labels: ["low", "high"],
          probabilities: [0.8, 0.2],
        },
      },
    });
    const remoteSubmit = vi.fn().mockResolvedValue({
      reports: {
        risk: {
          prediction: "remote",
          labels: ["low", "high"],
          probabilities: [0.1, 0.9],
        },
      },
    });
    const container = document.createElement("div");
    document.body.append(container);

    const mounted = mountForm(container, {
      transport: createRoutingTransport({
        transports: {
          local: { submit: localSubmit },
          remote: { submit: remoteSubmit },
        },
        selectTransport(request) {
          return request.serializedValues.mode === "remote" ? "remote" : "local";
        },
      }),
      schema: {
        fields: [
          {
            kind: "text",
            label: "Name",
            required: true,
          },
          {
            id: "mode",
            kind: "text",
            label: "Mode",
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
      initialValues: {
        name: "Alice",
        mode: "local",
      },
    });

    await flush();

    const localResult = await mounted.form.submit();

    expect(localSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        serializedValues: {
          name: "Alice",
          mode: "local",
        },
      }),
    );
    expect(localResult.reports.risk).toMatchObject({
      prediction: "local",
    });

    await flush();

    let reportFrame = getShadow(mounted.host).querySelector("mlf-report-frame");
    let reportRenderer = getShadow(reportFrame).querySelector("mlf-classifier-report");
    expect(getShadow(reportRenderer).textContent).toContain("80.0%");

    mounted.form.setValues({
      mode: "remote",
    });

    const remoteResult = await mounted.form.submit();

    expect(remoteSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        serializedValues: {
          name: "Alice",
          mode: "remote",
        },
      }),
    );
    expect(remoteResult.reports.risk).toMatchObject({
      prediction: "remote",
    });

    await flush();

    reportFrame = getShadow(mounted.host).querySelector("mlf-report-frame");
    reportRenderer = getShadow(reportFrame).querySelector("mlf-classifier-report");
    expect(getShadow(reportRenderer).textContent).toContain("90.0%");

    mounted.unmount();
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

  it("restores replaced container content on unmount when replacement is explicit", async () => {
    const container = document.createElement("div");
    const placeholder = document.createElement("section");
    placeholder.textContent = "dashboard";
    container.append(placeholder);
    document.body.append(container);

    const mounted = mountForm(container, {
      transport: {
        submit: vi.fn().mockResolvedValue({ reports: {} }),
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

    resolveTransport?.({ reports: {} });
    rejectTransport?.();
  });

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
              reports: {
                risk: {
                  prediction: "high",
                  labels: ["low", "high"],
                  probabilities: [0.2, 0.8],
                },
              },
            },
          };
        },
      },
      schema: {
        fields: [{ kind: "text", label: "Name", required: true }],
        reports: [{ kind: "classifier", id: "risk", label: "Risk" }],
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
              reports: {},
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
              reports: {
                risk: {
                  prediction: "final",
                },
              },
            },
          } as const;
        },
      },
      schema: {
        fields: [{ id: "name", kind: "text", label: "Name", required: true }],
        reports: [{ kind: "classifier", id: "risk", label: "Risk" }],
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

  it("forwards report transport to built-in reports through the kit mount", async () => {
    const reportTransport = {
      submit: vi.fn().mockResolvedValue(["tree root", "leaf a", "leaf b"]),
    };
    const container = document.createElement("div");
    document.body.append(container);
    const mounted = mountForm(container, {
      transport: {
        submit: vi.fn().mockResolvedValue({
          reports: {
            risk: {
              prediction: "high",
              labels: ["low", "high"],
              probabilities: [0.15, 0.85],
            },
          },
        }),
      },
      reportTransport,
      schema: {
        fields: [{ kind: "text", id: "name", label: "Name", required: true }],
        reports: [
          {
            kind: "classifier",
            id: "risk",
            label: "Risk",
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
        submit: vi.fn().mockResolvedValue({ reports: {} }),
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

  it("mounts explanation plugins, renders explanation panels, and triggers fetch after submit", async () => {
    const explanationResult = { feature_importance: { name: 0.9 } };
    const transportSubmit = vi.fn().mockResolvedValue(explanationResult);
    const registry = createBuiltinRegistry();

    registry.registerExplanation(
      defineExplanationDefinition({
        kind: "shap",
        schema: z
          .object({
            kind: z.literal("shap"),
            id: z.string().optional(),
            label: z.string().optional(),
          })
          .passthrough(),
        transport: () => ({ submit: transportSubmit }),
        describe: (_config, ctx) => ({
          component: "shap-renderer",
          props: { status: ctx.state.status },
        }),
      }),
    );

    const container = document.createElement("div");
    document.body.append(container);

    const mounted = mountForm(container, {
      registry,
      transport: {
        submit: vi.fn().mockResolvedValue({
          reports: {
            risk: {
              prediction: "high",
              labels: ["low", "high"],
              probabilities: [0.2, 0.8],
            },
          },
        }),
      },
      schema: {
        fields: [{ kind: "text", label: "Name", required: true }],
        reports: [{ kind: "classifier", id: "risk", label: "Risk" }],
        explanations: [{ kind: "shap", label: "SHAP Values" }],
      },
      initialValues: { name: "Alice" },
    });

    await flush();

    expect(mounted.form.explanations).toHaveLength(1);
    expect(mounted.form.explanations[0]?.id).toBe("shap-values");
    expect(mounted.form.explanations[0]?.state.status).toBe("idle");
    expect(mounted.form.state.explanationStates["shap-values"]?.status).toBe("idle");

    await mounted.form.submit();
    await flush();
    await flush();
    await flush();

    expect(transportSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        explanationId: "shap-values",
        values: { name: "Alice" },
        reports: expect.objectContaining({ risk: expect.any(Object) }),
      }),
    );

    expect(mounted.form.explanations[0]?.state.status).toBe("done");
    expect(mounted.form.explanations[0]?.state.result).toEqual(explanationResult);
    expect(mounted.form.state.explanationStates["shap-values"]?.status).toBe("done");

    const shadow = getShadow(mounted.host);
    expect(shadow.querySelector("mlf-explanation-panel")).not.toBeNull();

    mounted.unmount();
    container.remove();
  });

  it("supports unregisterExplanation on the engine registry", () => {
    const registry = createBuiltinRegistry();

    const def = defineExplanationDefinition({
      kind: "shap",
      schema: z.object({ kind: z.literal("shap"), id: z.string().optional() }).passthrough(),
      transport: () => ({ submit: vi.fn() }),
      describe: () => null,
    });

    registry.registerExplanation(def);
    expect(registry.getExplanation("shap")).toBeDefined();
    expect(registry.listExplanations()).toHaveLength(1);

    registry.unregisterExplanation("shap");
    expect(registry.getExplanation("shap")).toBeUndefined();
    expect(registry.listExplanations()).toHaveLength(0);

    // Re-registration after unregister must not throw.
    expect(() => registry.registerExplanation(def)).not.toThrow();
    expect(registry.getExplanation("shap")).toBeDefined();
  });

  it("mounts declarative custom fields, reports, and explanations without primitive registry wiring", async () => {
    const explanationSubmit = vi.fn().mockResolvedValue({
      top_features: [
        { feature: "income", score: 0.82 },
        { feature: "savings", score: 0.31 },
      ],
    });
    const registry = createBuiltinRegistry();

    registry.registerField(
      defineFieldKind({
        kind: "score",
        schema: z.object({
          kind: z.literal("score"),
          id: z.string().optional(),
          label: z.string(),
          min: z.number().default(0),
          max: z.number().default(100),
          step: z.number().optional(),
          ui: z.record(z.string(), z.unknown()).optional(),
        }),
        value: {
          default: () => 0,
          normalize: (value) => Number(value ?? 0),
          serialize: (value) => value,
        },
        validate: ({ value, config }) =>
          value < config.min || value > config.max ? ["Score out of range."] : [],
        render: {
          widget: "number",
          hints: ({ config }) => ({
            min: config.min,
            max: config.max,
            step: config.step ?? 1,
            unit: "%",
            placeholder: "Enter score",
          }),
        },
      }),
    );

    registry.registerReport(
      defineReportKind({
        kind: "risk-summary",
        schema: z.object({
          kind: z.literal("risk-summary"),
          id: z.string().optional(),
          label: z.string().optional(),
          source: z.string().optional(),
        }),
        resolve: ({ report, result }) => result.reports[report.source],
        render: {
          summary: ({ payload }) => ({
            title: "Risk summary",
            value: (payload as { score: number }).score,
            tone: (payload as { score: number }).score > 0.8 ? "danger" : "neutral",
          }),
          content: ({ payload }) => [
            {
              type: "metric",
              label: "Score",
              value: (payload as { score: number }).score,
            },
            {
              type: "list",
              label: "Drivers",
              items: (payload as { drivers: string[] }).drivers,
            },
          ],
        },
      }),
    );

    registry.registerExplanation(
      defineExplanationKind({
        kind: "shap",
        schema: z.object({
          kind: z.literal("shap"),
          id: z.string().optional(),
          label: z.string().optional(),
        }),
        fetch: () => ({ submit: explanationSubmit }),
        render: {
          summary: ({ state }) => ({
            title: "SHAP",
            tone: state.status === "error" ? "danger" : "neutral",
          }),
          content: ({ result }) => ({
            type: "table",
            label: "Feature impact",
            columns: ["feature", "score"],
            rows: ((result as { top_features: Array<Record<string, unknown>> }).top_features ??
              []) as Array<Record<string, unknown>>,
          }),
        },
      }),
    );

    const container = document.createElement("div");
    document.body.append(container);

    const mounted = mountForm(container, {
      registry,
      transport: {
        submit: vi.fn().mockResolvedValue({
          reports: {
            risk: {
              score: 0.91,
              drivers: ["income", "savings"],
            },
          },
        }),
      },
      schema: {
        fields: [{ kind: "score", label: "Score", min: 0, max: 100, step: 5 }],
        reports: [{ kind: "risk-summary", id: "risk", label: "Risk" }],
        explanations: [{ kind: "shap", label: "SHAP Values" }],
      },
      initialValues: { score: 85 },
    });

    await flush();

    const scoreInput = getDeclarativeFieldControlHost(mounted.host, 0) as HTMLInputElement;
    expect(scoreInput.getAttribute("aria-label")).toContain("Score");
    expect(scoreInput.value).toBe("85");

    await mounted.form.submit();
    await flush();
    await flush();
    await flush();

    expect(explanationSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        explanationId: "shap-values",
        values: { score: 85 },
      }),
    );

    const reportFrame = getShadow(mounted.host).querySelector("mlf-report-frame") as HTMLElement;
    const reportRenderer = getShadow(reportFrame).querySelector(
      "mlf-declarative-report",
    ) as HTMLElement;
    expect(getShadow(reportRenderer).textContent).toContain("Risk summary");
    expect(getShadow(reportRenderer).textContent).toContain("income");

    const explanationPanel = getShadow(mounted.host).querySelector(
      "mlf-explanation-panel",
    ) as HTMLElement;
    const explanationRenderer = getShadow(explanationPanel).querySelector(
      "mlf-declarative-explanation",
    ) as HTMLElement;
    expect(getShadow(explanationRenderer).textContent).toContain("Feature impact");
    expect(getShadow(explanationRenderer).textContent).toContain("income");

    mounted.unmount();
    container.remove();
  });
});
