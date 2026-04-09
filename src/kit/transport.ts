// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { Transport } from "@/engine";
import { kitErrorMessages, kitTransportDefaults } from "./constants";
import type { JsonTransportOptions } from "./types";

const defaultBody = (request: Parameters<Transport["submit"]>[0]) => ({
  [kitTransportDefaults.requestBodyKey]: request.serializedValues,
});

const defaultParse = async (response: Response): Promise<unknown> => {
  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

const resolveErrorMessage = (status: number, statusText: string, payload: unknown): string => {
  if (payload && typeof payload === "object" && "message" in payload) {
    const message = (payload as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }

  return kitErrorMessages.requestFailed(status, statusText);
};

export const createJsonTransport = (options: JsonTransportOptions): Transport => {
  return {
    async submit(request) {
      const fetchImpl = options.fetch ?? globalThis.fetch;

      if (typeof fetchImpl !== "function") {
        throw new Error(kitErrorMessages.missingFetch);
      }

      const headers = new Headers(options.headers);
      if (!headers.has("accept")) {
        headers.set("accept", kitTransportDefaults.acceptHeader);
      }
      if (!headers.has("content-type")) {
        headers.set("content-type", kitTransportDefaults.contentTypeHeader);
      }

      const response = await fetchImpl(String(options.endpoint), {
        method: options.method ?? kitTransportDefaults.method,
        headers,
        credentials: options.credentials,
        body: JSON.stringify((options.body ?? defaultBody)(request)),
        signal: request.signal,
      });

      const parse = options.parse ?? defaultParse;

      if (!response.ok) {
        let payload: unknown = null;

        try {
          payload = await parse(response);
        } catch {
          payload = null;
        }

        throw new Error(resolveErrorMessage(response.status, response.statusText, payload));
      }

      return parse(response);
    },
  };
};
