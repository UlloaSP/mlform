// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { afterEach, describe, expect, it } from "vite-plus/test";
import { chromium, type Browser } from "playwright";
import { createServer, type ViteDevServer } from "vite";
import { resolve } from "node:path";

const virtualId = "virtual:mlform-render-matrix";
const resolvedVirtualId = `\0${virtualId}`;

const html = `
  <!doctype html><html><body><div id="app"></div><script type="module">import "${virtualId}";</script></body></html>
`;

const appModule = `
  import * as z from "zod";
  import { createMlRegistryPack } from "/src/builtins/index.ts";
  import * as kit from "/src/kit/index.ts";
  import { executeFormPipeline, executeMultiBackendPipeline } from "/src/runtime/index.ts";
  import { resolveMappedReportPayload } from "/src/schema/index.ts";

  const mappedToSchema = z.union([
    z.string(),
    z.number(),
    z.record(z.string(), z.union([z.string(), z.number()]).nullish()),
  ]).optional();
  const pack = createMlRegistryPack();
  const state = { fetchRequest: null };

  kit.registerDefinedFieldKind(
    pack.registry,
    pack.descriptorRegistry,
    kit.defineFieldKind({
      kind: "score-slider",
      schema: z.object({
        kind: z.literal("score-slider"),
        id: z.string().optional(),
        label: z.string(),
        displayKey: z.string().optional(),
        mappedTo: mappedToSchema,
      }),
      value: {
        default: () => 0,
        normalize: (value) => Number(value ?? 0),
        serialize: (value) => value,
      },
      render: { widget: "number" },
    }),
  );

  kit.registerDefinedReportKind(
    pack.registry,
    pack.descriptorRegistry,
    kit.defineReportKind({
      kind: "risk-summary",
      schema: z.object({
        kind: z.literal("risk-summary"),
        id: z.string().optional(),
        label: z.string().optional(),
        mappedTo: mappedToSchema,
      }),
      resolve: ({ report, result }) => resolveMappedReportPayload(report, result),
      render: {
        content: ({ payload }) => ({ type: "json", label: "Risk summary", value: payload }),
      },
    }),
  );

  kit.registerDefinedReportKind(
    pack.registry,
    pack.descriptorRegistry,
    kit.defineReportKind({
      kind: "context-dump",
      schema: z.object({
        kind: z.literal("context-dump"),
        id: z.string().optional(),
        label: z.string().optional(),
        mappedTo: mappedToSchema,
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
    }),
  );

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
    registry: pack.registry,
    descriptorRegistry: pack.descriptorRegistry,
    schema,
    initialValues: { "runtime-score": 7, "runtime-sex": "M" },
    transport: {
      submit: async (request) => {
        return { reports: [{ mappedTo: "risk_b", prediction: "high", score: 0.91 }] };
      },
    },
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
    const submitResult = (await page.evaluate(
      "window.__mlformMatrix.submitFromPipeline()",
    )) as MatrixSubmit;
    const fanout = await page.evaluate("window.__mlformMatrix.runFanout()");

    expect(failures).toEqual([]);
    expect(submitResult.displayValues).toEqual({ display_score: 7, display_sex: "M" });
    expect(submitResult.modelValues).toEqual({
      score_a: 7,
      score_b: 7,
      sex_m_a: 1,
      sex_m_b: 1,
      sex_f_a: 0,
      sex_f_b: 0,
    });
    expect(submitResult.reports).toEqual([{ mappedTo: "risk_b", prediction: "high", score: 0.91 }]);
    expect(submitResult.fetchRequest.modelValues).toEqual(submitResult.modelValues);
    expect(submitResult.text).toContain("Risk summary");
    expect(submitResult.text).toContain("Context dump");
    expect(fanout).toEqual({
      modelA: { snapshot: { score_a: 7, sex_m_a: 1, sex_f_a: 0 }, target: "risk_a" },
      modelB: { snapshot: { score_b: 7, sex_m_b: 1, sex_f_b: 0 }, target: "risk_b" },
    });
  }, 20_000);
});
