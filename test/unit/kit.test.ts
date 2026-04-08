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
      serializedValues: {
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
        serializedValues: {},
        fields: [],
        reports: [],
      }),
    ).rejects.toThrow("backend offline");
  });
});
