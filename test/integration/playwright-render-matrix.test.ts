// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { afterEach, describe, expect, it } from "vite-plus/test";
import { chromium, type Browser } from "playwright";
import { createServer, type ViteDevServer } from "vite";
import { resolve } from "node:path";

const virtualId = "virtual:mlform-render-matrix";
const resolvedVirtualId = `\0${virtualId}`;

const html = `
  <!doctype html><html><body><div id="app"></div><div id="builtins"></div><script type="module">import "${virtualId}";</script></body></html>
`;

const appModule = `
  import * as z from "zod";
  import * as kit from "/src/kit/index.ts";
  import { focusPrimitiveField, mountPrimitiveForm } from "/src/primitives/index.ts";
  import * as view from "/src/view/index.ts";
  import { executeFormPipeline, executeMultiBackendPipeline } from "/src/runtime/index.ts";
  import {
    baseFieldConfigSchema,
    baseReportConfigSchema,
    resolveMappedReportPayload,
  } from "/src/schema/index.ts";

  const state = { fetchRequest: null };
  const scoreSlider = view.defineFieldKind({
      kind: "score-slider",
      schema: baseFieldConfigSchema.extend({
        kind: z.literal("score-slider"),
      }),
      value: {
        default: () => 0,
        normalize: (value) => Number(value ?? 0),
        serialize: (value) => value,
      },
      render: { widget: "number", hints: { input: "range", min: 0, max: 100, step: 1 } },
    });

  const riskSummary = view.defineReportKind({
      kind: "risk-summary",
      schema: baseReportConfigSchema.extend({
        kind: z.literal("risk-summary"),
      }),
      resolve: ({ report, result }) => resolveMappedReportPayload(report, result),
      render: {
        content: ({ payload }) => ({ type: "json", label: "Risk summary", value: payload }),
      },
    });

  const contextDump = view.defineReportKind({
      kind: "context-dump",
      schema: baseReportConfigSchema.extend({
        kind: z.literal("context-dump"),
      }),
      fetch: () => ({
        submit: async (request) => {
          state.fetchRequest = request;
          return {
            reportId: request.reportId,
            modelValues: request.modelValues,
          };
        },
      }),
      resolve: () => undefined,
      render: {
        content: ({ payload }) => ({ type: "json", label: "Context dump", value: payload }),
      },
    });

  const plugin = view.defineMLFormPlugin({
    fields: [scoreSlider],
    reports: [riskSummary, contextDump],
  });

  const schema = {
    fields: [
      {
        kind: "score-slider",
        id: "runtime-score",
        label: "Score",
        displayKey: "display_score",
        mappedTo: { modelA: "score_a", modelB: "score_b" },
      },
      {
        kind: "onehot-category",
        id: "runtime-sex",
        label: "Sex",
        displayKey: "display_sex",
        options: [
          { label: "Male", value: "M", mappedTo: { modelA: "sex_m_a", modelB: "sex_m_b" } },
          { label: "Female", value: "F", mappedTo: { modelA: "sex_f_a", modelB: "sex_f_b" } },
        ],
      },
    ],
    reports: [
      {
        kind: "risk-summary",
        id: "runtime-risk",
        label: "Risk",
        mappedTo: { modelA: "risk_a", modelB: "risk_b" },
      },
      {
        kind: "context-dump",
        id: "runtime-context",
        label: "Context",
      },
    ],
  };

  const mounted = kit.mountForm(document.querySelector("#app"), {
    plugins: [plugin],
    schema,
    initialValues: { "runtime-score": 7, "runtime-sex": "M" },
    transport: {
      submit: async (request) => {
        return {
          reports: [
            {
              backend: "modelB",
              mappedTo: "risk_b",
              status: "ready",
              payload: { prediction: "high", score: 0.91 },
            },
          ],
        };
      },
    },
  });

  const builtinMount = kit.mountForm(document.querySelector("#builtins"), {
    schema: {
      fields: [
        {
          kind: "long-text",
          id: "bio",
          label: "Bio",
          minLength: 3,
          maxLength: 5,
          rows: 6,
          includeInSubmission: false,
        },
        {
          kind: "single-choice",
          id: "plan",
          label: "Plan",
          options: ["free", { label: "Professional", value: "pro" }],
          includeInSubmission: false,
        },
        {
          kind: "multi-choice",
          id: "channels",
          label: "Channels",
          options: ["email", "sms"],
          includeInSubmission: false,
        },
        {
          kind: "rating",
          id: "rating",
          label: "Rating",
          min: 1,
          max: 5,
          step: 2,
          includeInSubmission: false,
        },
        {
          kind: "series",
          id: "observations",
          label: "Observations",
          minPoints: 1,
          maxPoints: 2,
          field1: { kind: "text", label: "Code", required: true },
          field2: { kind: "date", label: "Day", required: true },
          defaultValue: [{ field1: "AA", field2: "2026-01-01" }],
          includeInSubmission: false,
        },
      ],
    },
    transport: { submit: async () => ({ reports: [] }) },
  });

  const textOf = (root) => {
    if (!root) {
      return "";
    }
    let text = root.textContent ?? "";
    for (const element of root.querySelectorAll?.("*") ?? []) {
      text += " " + textOf(element.shadowRoot);
    }
    return text;
  };
  const submitFromPipeline = async () => {
    const pipelineResult = await executeFormPipeline({
      form: mounted.form,
      reportFetchMode: "all",
    });
    await new Promise((resolve) => setTimeout(resolve, 50));
    const submitResult = pipelineResult.submitResult;
    return {
      displayValues: submitResult.displayValues,
      modelValues: submitResult.modelValues,
      reports: submitResult.reports,
      reportFetchResults: pipelineResult.reportFetchResults,
      fetchRequest: {
        reportId: state.fetchRequest.reportId,
        modelValues: state.fetchRequest.modelValues,
      },
      text: textOf(document.querySelector("#app")),
    };
  };

  window.__mlformMatrix = {
    submitFromPipeline,
    async mountDarkNumber() {
      const container = document.createElement("div");
      container.id = "dark-number";
      document.body.append(container);
      const mounted = kit.mountForm(container, {
        schema: { fields: [
          { kind: "number", id: "ph", label: "Editable pH" },
          { kind: "number", id: "readonly-ph", label: "Media pH", readOnly: true },
        ] },
        initialValues: { ph: 3, "readonly-ph": 3 },
        designSystem: { theme: "cobalt", mode: "dark" },
        transport: { submit: async () => ({ reports: [] }) },
      });
      await mounted.host.updateComplete;
      const frame = mounted.host.shadowRoot.querySelector("mlf-field-frame");
      await frame.updateComplete;
      const field = frame.shadowRoot.querySelector("mlf-number-field");
      await field.updateComplete;
      const input = field.shadowRoot.querySelector("input");
      const style = getComputedStyle(input);
      const readonlyFrame = mounted.host.shadowRoot.querySelector('[data-field-id="readonly-ph"]');
      await readonlyFrame.updateComplete;
      const readonlyField = readonlyFrame.shadowRoot.querySelector("mlf-number-field");
      await readonlyField.updateComplete;
      const readonlyInput = readonlyField.shadowRoot.querySelector("input");
      const readonlyStyle = getComputedStyle(readonlyInput);
      const result = {
        background: style.backgroundColor,
        color: style.color,
        readonlyBackground: readonlyStyle.backgroundColor,
        readonlyColor: readonlyStyle.color,
      };
      return result;
    },
    async mountInRegisteredFrame(frame) {
      const targetDocument = frame.contentDocument;
      const targetWindow = frame.contentWindow;
      const previousMatchMedia = targetWindow.matchMedia;
      targetWindow.matchMedia = (query) => ({
        matches: query === "(prefers-color-scheme: dark)",
        media: query,
        addEventListener() {},
        removeEventListener() {},
      });
      try {
        const results = [];
        for (const layout of [undefined, {
          kind: "tabs",
          tabs: [{ title: "Main", children: [{ kind: "field", field: "name" }] }],
        }]) {
          const target = targetDocument.createElement("div");
          targetDocument.body.append(target);
          const mounted = kit.mountForm(target, {
            schema: { fields: [{ id: "name", kind: "text", label: "Name" }] },
            layout,
            transport: { submit: async () => ({ reports: [] }) },
          });
          try {
            await mounted.host.updateComplete;
            const frameElement = mounted.host.shadowRoot.querySelector("mlf-field-frame");
            await frameElement.updateComplete;
            const fieldElement = frameElement.shadowRoot.querySelector("mlf-text-field");
            await fieldElement.updateComplete;
            const input = fieldElement.shadowRoot.querySelector("input");
            await focusPrimitiveField(mounted.host, "name");
            results.push({
              scheme: mounted.designSystem.resolved?.effectiveScheme,
              focused: fieldElement.shadowRoot.activeElement === input,
            });
          } finally {
            mounted.unmount();
            target.remove();
          }
        }
        return results;
      } finally {
        targetWindow.matchMedia = previousMatchMedia;
      }
    },
    async mountInFrame() {
      const frame = document.createElement("iframe");
      frame.srcdoc = '<div id="vertical"></div><div id="tabs"></div><div id="primitive"></div>';
      document.body.append(frame);
      await new Promise((resolve) => frame.addEventListener("load", resolve, { once: true }));
      const targetDocument = frame.contentDocument;
      const baseOptions = {
        schema: { fields: [{ kind: "text", id: "name", label: "Name" }] },
        transport: { submit: async () => ({ reports: [] }) },
      };
      const attempts = [
        ["#vertical", baseOptions],
        ["#tabs", {
          ...baseOptions,
          layout: {
            kind: "tabs",
            tabs: [{ title: "Main", children: [{ kind: "field", field: "name" }] }],
          },
        }],
      ].map(([selector, options]) => {
        try {
          const mounted = kit.mountForm(targetDocument.querySelector(selector), options);
          mounted.unmount();
          return "mounted";
        } catch (error) {
          return error.message;
        }
      });
      try {
        mountPrimitiveForm(targetDocument.querySelector("#primitive"), mounted.form);
        attempts.push("mounted");
      } catch (error) {
        attempts.push(error.message);
      }
      frame.remove();
      return attempts;
    },
    builtinValues() {
      return Object.fromEntries(
        ["bio", "plan", "channels", "rating"].map((id) => [
          id,
          builtinMount.form.getField(id).state.value,
        ]),
      );
    },
    seriesValue() {
      return builtinMount.form.getField("observations").state.value.map((point) => ({
        field1: point.field1,
        field2: point.field2 instanceof Date ? point.field2.toISOString().slice(0, 10) : point.field2,
      }));
    },
    async runFanout() {
      const result = await executeMultiBackendPipeline({
        form: mounted.form,
        backends: ["modelA", "modelB"],
        reportFetchMode: "none",
      });
      return {
        modelA: {
          snapshot: result.runs.modelA.snapshot.modelValues,
          target: result.runs.modelA.submitResult.reportContexts["runtime-risk"].targetKey,
        },
        modelB: {
          snapshot: result.runs.modelB.snapshot.modelValues,
          target: result.runs.modelB.submitResult.reportContexts["runtime-risk"].targetKey,
        },
      };
    },
  };
`;

let server: ViteDevServer | undefined;
let browser: Browser | undefined;

type MatrixSubmit = {
  displayValues: Record<string, unknown>;
  modelValues: Record<string, unknown>;
  reports: Record<string, unknown>;
  fetchRequest: { modelValues?: Record<string, unknown> };
  text: string;
};

const startServer = async (): Promise<string> => {
  server = await createServer({
    configFile: false,
    root: process.cwd(),
    resolve: {
      alias: {
        "@": resolve(process.cwd(), "src"),
      },
    },
    server: { host: "127.0.0.1", port: 0 },
    plugins: [
      {
        name: "mlform-render-matrix",
        resolveId: (id) => (id === virtualId ? resolvedVirtualId : undefined),
        load: (id) => (id === resolvedVirtualId ? appModule : undefined),
        configureServer(vite) {
          vite.middlewares.use(async (request, response, next) => {
            if (request.url !== "/") {
              next();
              return;
            }
            response.setHeader("Content-Type", "text/html");
            response.end(await vite.transformIndexHtml("/", html));
          });
        },
      },
    ],
  });
  await server.listen();
  const address = server.httpServer?.address();
  if (!address || typeof address === "string") {
    throw new Error("Vite server did not expose a TCP port.");
  }
  return `http://127.0.0.1:${address.port}/`;
};

describe("Playwright render matrix", () => {
  afterEach(async () => {
    await browser?.close();
    await server?.close();
    browser = undefined;
    server = undefined;
  });

  it("keeps number input colors legible in Cobalt dark mode", async () => {
    const url = await startServer();
    browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto(url);
    await page.waitForFunction("window.__mlformMatrix?.mountDarkNumber");

    const colors = (await page.evaluate("window.__mlformMatrix.mountDarkNumber()")) as {
      background: string;
      color: string;
      readonlyBackground: string;
      readonlyColor: string;
    };
    await page
      .locator("#dark-number mlf-number-field input")
      .first()
      .evaluate((input) => {
        (input as HTMLElement).style.transition = "none";
      });

    const session = await page.context().newCDPSession(page);
    await session.send("DOM.enable");
    await session.send("CSS.enable");
    await session.send("DOM.getDocument", { depth: -1, pierce: true });
    const remote = await session.send("Runtime.evaluate", {
      expression:
        'document.querySelector("#dark-number mlf-form").shadowRoot.querySelector("mlf-field-frame").shadowRoot.querySelector("mlf-number-field").shadowRoot.querySelector("input")',
    });
    const node = await session.send("DOM.requestNode", { objectId: remote.result.objectId! });
    await session.send("CSS.forcePseudoState", {
      nodeId: node.nodeId,
      forcedPseudoClasses: ["autofill"],
    });
    const autofillColors = await page
      .locator("#dark-number mlf-number-field input")
      .first()
      .evaluate((input) => {
        const style = getComputedStyle(input);
        return {
          background: style.backgroundColor,
          color: style.color,
          shadow: style.boxShadow,
          fill: style.webkitTextFillColor,
        };
      });
    expect(colors.background).not.toBe("rgb(255, 255, 255)");
    expect(colors.color).not.toBe(colors.background);
    expect(colors.readonlyBackground).toBe("rgb(22, 35, 59)");
    expect(colors.readonlyColor).toBe(colors.color);
    expect(autofillColors.shadow).toContain(colors.background);
    expect(autofillColors.fill).toBe(colors.color);

    await page.emulateMedia({ forcedColors: "active" });
    const forcedColors = await page
      .locator("#dark-number mlf-number-field input")
      .first()
      .evaluate((input) => {
        const style = getComputedStyle(input);
        return { shadow: style.boxShadow, color: style.color, fill: style.webkitTextFillColor };
      });
    expect(forcedColors.shadow).toBe("none");
    expect(forcedColors.fill).toBe(forcedColors.color);
  }, 20_000);

  it("renders custom plugins, onehot mappedTo, report mappedTo maps, and fanout", async () => {
    const url = await startServer();
    browser = await chromium.launch();
    const page = await browser.newPage();
    const failures: string[] = [];
    page.on("pageerror", (error) => failures.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") {
        failures.push(message.text());
      }
    });

    await page.goto(url);
    await page.waitForSelector("mlf-form");
    const scoreInput = page.locator('input[type="range"]').first();
    await scoreInput.waitFor();
    expect(await scoreInput.getAttribute("min")).toBe("0");
    expect(await scoreInput.getAttribute("max")).toBe("100");
    expect(await scoreInput.getAttribute("step")).toBe("1");
    await scoreInput.evaluate((input) => {
      const range = input as HTMLInputElement;
      range.value = "8";
      range.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
    });
    const submitResult = (await page.evaluate(
      "window.__mlformMatrix.submitFromPipeline()",
    )) as MatrixSubmit;
    const fanout = await page.evaluate("window.__mlformMatrix.runFanout()");

    expect(failures).toEqual([]);
    expect(submitResult.displayValues).toEqual({ display_score: 8, display_sex: "M" });
    expect(submitResult.modelValues).toEqual({
      score_a: 8,
      score_b: 8,
      sex_m_a: 1,
      sex_m_b: 1,
      sex_f_a: 0,
      sex_f_b: 0,
    });
    expect(submitResult.reports).toEqual([
      {
        backend: "modelB",
        mappedTo: "risk_b",
        status: "ready",
        payload: { prediction: "high", score: 0.91 },
      },
    ]);
    expect(submitResult.fetchRequest.modelValues).toEqual(submitResult.modelValues);
    expect(submitResult.text).toContain("Risk summary");
    expect(submitResult.text).toContain("Context dump");
    expect(fanout).toEqual({
      modelA: { snapshot: { score_a: 8, sex_m_a: 1, sex_f_a: 0 }, target: "risk_a" },
      modelB: { snapshot: { score_b: 8, sex_m_b: 1, sex_f_b: 0 }, target: "risk_b" },
    });
  }, 20_000);

  it("rejects mounting from a parent window into an unregistered iframe", async () => {
    const url = await startServer();
    browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto(url);
    await page.waitForSelector("mlf-form");

    expect(await page.evaluate("window.__mlformMatrix.mountInFrame()")).toEqual([
      "MLForm elements are not registered in the container's document. Load MLForm in that document before mounting.",
      "MLForm elements are not registered in the container's document. Load MLForm in that document before mounting.",
      "MLForm elements are not registered in the container's document. Load MLForm in that document before mounting.",
    ]);
  }, 20_000);

  it("renders normally when MLForm loads inside the iframe", async () => {
    const url = await startServer();
    browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto(url);
    await page.evaluate((frameUrl) => {
      const frame = document.createElement("iframe");
      frame.id = "embedded-form";
      frame.src = frameUrl;
      document.body.append(frame);
    }, url);

    const embedded = page.frameLocator("#embedded-form");
    await embedded.locator("mlf-form").first().waitFor();
    await embedded.locator('input[type="range"]').waitFor();
    expect(await embedded.locator('input[type="range"]').getAttribute("min")).toBe("0");
  }, 20_000);

  it("uses the target document for design media and field focus from a parent caller", async () => {
    const url = await startServer();
    browser = await chromium.launch();
    const page = await browser.newPage();
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto(url);
    await page.evaluate((frameUrl) => {
      const frame = document.createElement("iframe");
      frame.id = "embedded-form";
      frame.src = frameUrl;
      document.body.append(frame);
    }, url);
    await page.frameLocator("#embedded-form").locator("mlf-form").first().waitFor();

    expect(
      await page.evaluate(
        "window.__mlformMatrix.mountInRegisteredFrame(document.querySelector('#embedded-form'))",
      ),
    ).toEqual([
      { scheme: "dark", focused: true },
      { scheme: "dark", focused: true },
    ]);
  }, 20_000);

  it("runs the weak built-in field families in a real browser", async () => {
    const url = await startServer();
    browser = await chromium.launch();
    const page = await browser.newPage();

    await page.goto(url);
    const textarea = page.locator("mlf-long-text-field textarea");
    await textarea.fill("hello");
    expect(await textarea.getAttribute("minlength")).toBe("3");
    expect(await textarea.getAttribute("maxlength")).toBe("5");
    expect(await textarea.getAttribute("rows")).toBe("6");

    await page.locator('mlf-single-choice-field input[value="pro"]').check();
    await page.locator('mlf-multi-choice-field input[value="email"]').check();
    await page.locator('mlf-multi-choice-field input[value="sms"]').check();
    const ratingButtons = page.locator("mlf-rating-field button");
    await ratingButtons.first().focus();
    await ratingButtons.first().press("ArrowRight");
    expect(await ratingButtons.nth(1).getAttribute("aria-checked")).toBe("true");
    expect(
      await ratingButtons
        .nth(1)
        .evaluate((button) => (button.getRootNode() as ShadowRoot).activeElement === button),
    ).toBe(true);

    expect(await page.evaluate("window.__mlformMatrix.builtinValues()")).toEqual({
      bio: "hello",
      plan: "pro",
      channels: ["email", "sms"],
      rating: 3,
    });
  }, 20_000);

  it("keeps series limits and focus operable in a real browser", async () => {
    const url = await startServer();
    browser = await chromium.launch();
    const page = await browser.newPage();

    await page.goto(url);
    const series = page.locator("mlf-series-field");
    const add = series.locator(".add-btn");
    await add.focus();
    await page.keyboard.press("Enter");

    const textInputs = series.locator('input[type="text"]');
    const dateInputs = series.locator('input[type="date"]');
    expect(
      await textInputs
        .nth(1)
        .evaluate((input) => (input.getRootNode() as ShadowRoot).activeElement === input),
    ).toBe(true);
    expect(await add.isDisabled()).toBe(true);

    await textInputs.nth(1).fill("BB");
    await dateInputs.nth(1).fill("2026-01-03");
    const removeButtons = series.locator(".remove-btn");
    await removeButtons.first().focus();
    await page.keyboard.press("Space");

    expect(await removeButtons.first().isDisabled()).toBe(true);
    expect(
      await add.evaluate((button) => (button.getRootNode() as ShadowRoot).activeElement === button),
    ).toBe(true);
    expect(await page.evaluate("window.__mlformMatrix.seriesValue()")).toEqual([
      { field1: "BB", field2: "2026-01-03" },
    ]);
  }, 20_000);
});
