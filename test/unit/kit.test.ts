// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { describe, expect, it, vi } from "vite-plus/test";
import { createJsonTransport } from "@/kit";

describe("kit", () => {
  it("creates a JSON transport that sends serialized inputs by default", async () => {
    const json = vi.fn().mockResolvedValue({ reports: { risk: { prediction: "high" } } });
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
    const transport = createJsonTransport({
      endpoint: "https://api.example.com/predict",
      fetch: fetchMock as typeof globalThis.fetch,
    });

    const result = await transport.submit({
      values: {
        age: 34,
      },
      fieldValues: {
        age: 34,
      },
      serializedValues: {
        age: 34,
      },
      serializedFieldValues: {
        age: 34,
      },
      fields: [],
      reports: [],
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.com/predict",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          inputs: {
            age: 34,
          },
        }),
      }),
    );
    expect(result).toEqual({
      reports: {
        risk: {
          prediction: "high",
        },
      },
    });
  });

  it("surfaces backend error messages returned by the transport", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      statusText: "Service Unavailable",
      headers: new Headers({
        "content-type": "application/json",
      }),
      json: vi.fn().mockResolvedValue({
        message: "backend offline",
      }),
      text: vi.fn(),
    });
    const transport = createJsonTransport({
      endpoint: "https://api.example.com/predict",
      fetch: fetchMock as typeof globalThis.fetch,
    });

    await expect(
      transport.submit({
        values: {},
        fieldValues: {},
        serializedValues: {},
        serializedFieldValues: {},
        fields: [],
        reports: [],
      }),
    ).rejects.toThrow("backend offline");
  });

  it("rejects HTTP methods that do not support the kit JSON body contract", () => {
    expect(() =>
      createJsonTransport({
        endpoint: "https://api.example.com/predict",
        method: "GET" as never,
        fetch: vi.fn() as typeof globalThis.fetch,
      }),
    ).toThrow('Unsupported HTTP method "GET"');
  });

  it("passes through custom request bodies without forcing JSON serialization", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
      statusText: "No Content",
      headers: new Headers(),
      json: vi.fn(),
      text: vi.fn().mockResolvedValue(""),
    });
    const transport = createJsonTransport({
      endpoint: "https://api.example.com/upload",
      fetch: fetchMock as typeof globalThis.fetch,
      body: () => {
        const body = new FormData();
        body.set("file", new Blob(["hello"], { type: "text/plain" }), "hello.txt");
        return body;
      },
    });

    await transport.submit({
      values: {},
      fieldValues: {},
      serializedValues: {},
      serializedFieldValues: {},
      fields: [],
      reports: [],
    });

    const requestInit = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(requestInit.body).toBeInstanceOf(FormData);
    expect(new Headers(requestInit.headers).has("content-type")).toBe(false);
  });
});
