// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { describe, expect, it, vi } from "vite-plus/test";
import {
  createFanoutTransport,
  createFallbackTransport,
  createJsonTransport,
  createRoutingTransport,
} from "@/kit";

const baseRequest = {
  values: {},
  fieldValues: {},
  serializedValues: {},
  serializedFieldValues: {},
  fields: [],
  reports: [],
} as const;

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
      ...baseRequest,
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

    await expect(transport.submit(baseRequest)).rejects.toThrow("backend offline");
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

    await transport.submit(baseRequest);

    const requestInit = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(requestInit.body).toBeInstanceOf(FormData);
    expect(new Headers(requestInit.headers).has("content-type")).toBe(false);
  });

  it("routes submissions through a selected transport without exposing backend choice", async () => {
    const localSubmit = vi.fn().mockResolvedValue({
      reports: {
        risk: { prediction: "local" },
      },
    });
    const remoteSubmit = vi.fn().mockResolvedValue({
      reports: {
        risk: { prediction: "remote" },
      },
    });
    const transport = createRoutingTransport({
      transports: {
        local: { submit: localSubmit },
        remote: { submit: remoteSubmit },
      },
      selectTransport(request) {
        return request.serializedValues.mode === "remote" ? "remote" : "local";
      },
    });

    await transport.submit({
      ...baseRequest,
      serializedValues: {
        mode: "local",
      },
    });
    await transport.submit({
      ...baseRequest,
      serializedValues: {
        mode: "remote",
      },
    });

    expect(localSubmit).toHaveBeenCalledTimes(1);
    expect(remoteSubmit).toHaveBeenCalledTimes(1);
  });

  it("fans out to every transport and preserves per-transport raw output by default", async () => {
    const transport = createFanoutTransport({
      transports: {
        primary: {
          submit: vi.fn().mockResolvedValue({
            reports: {
              risk: { prediction: "approved" },
            },
            meta: {
              model: "primary",
            },
          }),
        },
        shadow: {
          submit: vi.fn().mockResolvedValue({
            reports: {
              score: { value: 0.92 },
            },
            meta: {
              model: "shadow",
            },
          }),
        },
      },
    });

    await expect(transport.submit(baseRequest)).resolves.toEqual({
      reports: {
        risk: { prediction: "approved" },
        score: { value: 0.92 },
      },
      meta: {
        transports: {
          primary: { model: "primary" },
          shadow: { model: "shadow" },
        },
      },
      raw: {
        primary: {
          reports: {
            risk: { prediction: "approved" },
          },
          meta: {
            model: "primary",
          },
        },
        shadow: {
          reports: {
            score: { value: 0.92 },
          },
          meta: {
            model: "shadow",
          },
        },
      },
    });
  });

  it("rejects duplicate report ids in default fanout merges", async () => {
    const transport = createFanoutTransport({
      transports: [
        {
          submit: vi.fn().mockResolvedValue({
            reports: {
              risk: { prediction: "approved" },
            },
          }),
        },
        {
          submit: vi.fn().mockResolvedValue({
            reports: {
              risk: { prediction: "rejected" },
            },
          }),
        },
      ],
    });

    await expect(transport.submit(baseRequest)).rejects.toThrow(
      'createFanoutTransport received report "risk"',
    );
  });

  it("falls back to later transports after failures", async () => {
    const primarySubmit = vi.fn().mockRejectedValue(new Error("primary offline"));
    const secondarySubmit = vi.fn().mockResolvedValue({
      reports: {
        risk: { prediction: "fallback" },
      },
    });
    const transport = createFallbackTransport({
      transports: [{ submit: primarySubmit }, { submit: secondarySubmit }],
    });

    await expect(transport.submit(baseRequest)).resolves.toEqual({
      reports: {
        risk: { prediction: "fallback" },
      },
    });
    expect(primarySubmit).toHaveBeenCalledTimes(1);
    expect(secondarySubmit).toHaveBeenCalledTimes(1);
  });
});
