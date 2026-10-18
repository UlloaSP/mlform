const unusedAssets = {
  ASSETS: {
    async fetch(): Promise<Response> {
      throw new Error("Unexpected asset request");
    },
  },
};
import assert from "node:assert/strict";
import test from "node:test";
import worker from "../../worker.ts";

const request = (path: string, init?: RequestInit) =>
  new Request(`https://playground.mlform.eshkra.dev${path}`, init);

await test("serves static requests through the asset binding", async () => {
  const incoming = request("/assets/app.js");
  const response = await worker.fetch(incoming, {
    ASSETS: {
      fetch: async (received) => {
        assert.equal(received, incoming);
        return new Response("app");
      },
    },
  });
  assert.equal(await response.text(), "app");
});

await test("proxies both prediction APIs, preserving payload and success or failure status", async (t) => {
  const calls: { url: RequestInfo | URL; init: RequestInit; body: string }[] = [];
  t.mock.method(globalThis, "fetch", async (url: RequestInfo | URL, init: RequestInit) => {
    calls.push({ url, init, body: await new Response(init.body).text() });
    return Response.json(
      calls.length === 1 ? { prediction: 0.8 } : { detail: "Invalid parameters" },
      {
        status: calls.length === 1 ? 200 : 422,
        headers: { "Set-Cookie": "upstream=secret" },
      },
    );
  });
  for (const [path, upstream, status, payload] of [
    [
      "/api/dosetailor/inference/nolabs",
      "https://api.dosetailor.com/inference/nolabs",
      200,
      { prediction: 0.8 },
    ],
    [
      "/api/m3diseen/a2022/printability",
      "https://api.m3diseen.com/a2022/printability",
      422,
      { detail: "Invalid parameters" },
    ],
  ] as const) {
    const response = await worker.fetch(
      request(path, {
        method: "POST",
        body: '{"example":1}',
        headers: {
          "Content-Type": "application/json",
          Cookie: "session=private",
          Authorization: "Bearer private",
        },
      }),
      unusedAssets,
    );
    const call = calls.at(-1);
    assert.ok(call);
    assert.equal(call.url, upstream);
    assert.equal(call.init.method, "POST");
    assert.equal(call.body, '{"example":1}');
    assert.deepEqual(call.init.headers, { "Content-Type": "application/json" });
    assert.equal(response.status, status);
    assert.deepEqual(await response.json(), payload);
    assert.equal(response.headers.get("Cache-Control"), "no-store");
    assert.equal(response.headers.get("Set-Cookie"), null);
  }
});

await test("rejects unknown endpoints and methods without contacting upstream", async (t) => {
  const upstream = t.mock.method(globalThis, "fetch");
  for (const path of [
    "/api/unknown",
    "/api/dosetailor/admin",
    "/api/m3diseen/a2022/printability/extra",
  ] as const) {
    assert.equal((await worker.fetch(request(path), unusedAssets)).status, 404);
  }
  const response = await worker.fetch(request("/api/dosetailor/inference/labs"), unusedAssets);
  assert.equal(response.status, 405);
  assert.equal(response.headers.get("Allow"), "POST");
  assert.equal(upstream.mock.callCount(), 0);
});

await test("reports network errors and aborts as terminal gateway failures", async (t) => {
  t.mock.method(globalThis, "fetch", async (_url: RequestInfo | URL, { signal }: RequestInit) => {
    signal?.throwIfAborted();
    throw new TypeError("Network failure");
  });
  const response = await worker.fetch(
    request("/api/m3diseen/a2022/dissolution", {
      method: "POST",
      body: "{}",
    }),
    unusedAssets,
  );
  assert.equal(response.status, 502);
  assert.match((await response.json()).error, /unavailable/);

  const controller = new AbortController();
  controller.abort();
  const aborted = await worker.fetch(
    request("/api/m3diseen/a2022/dissolution", {
      method: "POST",
      body: "{}",
      signal: controller.signal,
    }),
    unusedAssets,
  );
  assert.equal(aborted.status, 504);
});
