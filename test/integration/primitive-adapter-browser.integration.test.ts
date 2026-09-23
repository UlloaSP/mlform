// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { afterEach, describe, expect, it } from "vite-plus/test";
import { chromium, type Browser } from "playwright";
import { createServer, type ViteDevServer } from "vite";
import { resolve } from "node:path";

let server: ViteDevServer | undefined;
let browser: Browser | undefined;

describe("primitive adapter in a browser", () => {
  afterEach(async () => {
    await browser?.close();
    await server?.close();
    browser = undefined;
    server = undefined;
  });

  it("preserves the input element, focus and cursor across view updates", async () => {
    server = await createServer({
      configFile: false,
      root: process.cwd(),
      resolve: { alias: { "@": resolve(process.cwd(), "src") } },
      server: { host: "127.0.0.1", port: 0 },
      plugins: [
        {
          name: "primitive-adapter-probe",
          configureServer(vite) {
            vite.middlewares.use(async (request, response, next) => {
              if (request.url !== "/") return next();
              response.setHeader("Content-Type", "text/html");
              response.end(
                await vite.transformIndexHtml(
                  "/",
                  '<!doctype html><html><body><script type="module" src="/probe.js"></script></body></html>',
                ),
              );
            });
          },
          resolveId(id) {
            return id === "/probe.js" ? "\0primitive-adapter-probe" : undefined;
          },
          load(id) {
            if (id !== "\0primitive-adapter-probe") return undefined;
            return `
              import { createFormView } from "/src/view/index.ts";
              import { createPrimitiveAdapter } from "/src/kit/index.ts";
              const view = createFormView({
                schema: { fields: [
                  { kind: "text", id: "name", label: "Name" },
                  { kind: "text", id: "other", label: "Other" },
                ] },
                transport: { submit: async () => ({ reports: [] }) },
                layout: { kind: "stacked", children: [
                  { kind: "custom", id: "editor", fields: ["name"] },
                  { kind: "field", field: "other" },
                ] },
              });
              const slot = document.createElement("div");
              document.body.append(slot);
              const ui = createPrimitiveAdapter(view);
              const frame = ui.mountField(slot, "name");
              window.probe = async () => {
                await frame.updateComplete;
                const control = frame.shadowRoot.querySelector("mlf-text-field");
                await control.updateComplete;
                const input = control.shadowRoot.querySelector("input");
                input.value = "Ada";
                input.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
                input.focus();
                input.setSelectionRange(1, 1);
                view.form.getField("other").setValue("changed");
                await frame.updateComplete;
                await control.updateComplete;
                const nextControl = frame.shadowRoot.querySelector("mlf-text-field");
                const nextInput = nextControl.shadowRoot.querySelector("input");
                const result = {
                  sameFrame: slot.firstElementChild === frame,
                  sameInput: nextInput === input,
                  focused: control.shadowRoot.activeElement === input,
                  cursor: input.selectionStart,
                };
                ui.dispose();
                view.dispose();
                slot.remove();
                return result;
              };
            `;
          },
        },
      ],
    });
    await server.listen();
    const address = server.httpServer?.address();
    if (!address || typeof address === "string") throw new Error("Vite did not expose a port.");
    browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto(`http://127.0.0.1:${address.port}/`);
    await page.waitForFunction(() => "probe" in window);
    expect(await page.evaluate("window.probe()")).toEqual({
      sameFrame: true,
      sameInput: true,
      focused: true,
      cursor: 1,
    });
  }, 20_000);
});
