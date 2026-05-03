// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { isRecord } from "./internal-core";
import type { TransportStreamEvent } from "./types";

export const parseSseBlocks = async function* (
  stream: ReadableStream<Uint8Array>,
): AsyncIterable<{ id?: string; event?: string; data: string; retry?: number }> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });

    while (true) {
      const separatorIndex = buffer.indexOf("\n\n");
      if (separatorIndex === -1) {
        break;
      }

      const block = buffer.slice(0, separatorIndex);
      buffer = buffer.slice(separatorIndex + 2);
      let id: string | undefined;
      let event: string | undefined;
      let retry: number | undefined;
      const dataLines: string[] = [];

      for (const rawLine of block.split(/\r?\n/)) {
        if (!rawLine || rawLine.startsWith(":")) {
          continue;
        }

        const separator = rawLine.indexOf(":");
        const field = separator === -1 ? rawLine : rawLine.slice(0, separator);
        const valueText = separator === -1 ? "" : rawLine.slice(separator + 1).trimStart();

        if (field === "id") id = valueText;
        else if (field === "event") event = valueText;
        else if (field === "retry") retry = Number.parseInt(valueText, 10);
        else if (field === "data") dataLines.push(valueText);
      }

      yield {
        id,
        event,
        data: dataLines.join("\n"),
        retry: Number.isFinite(retry) ? retry : undefined,
      };
    }
  }

  if (buffer.trim()) {
    yield { data: buffer.trim() };
  }
};

export const defaultDecodeSseEvent = async (event: {
  id?: string;
  event?: string;
  data: string;
  retry?: number;
}): Promise<TransportStreamEvent> => {
  let parsed: unknown = event.data;
  if (event.data) {
    try {
      parsed = JSON.parse(event.data);
    } catch {
      parsed = event.data;
    }
  }

  if (event.event === "progress" && isRecord(parsed)) {
    return {
      type: "progress",
      loaded: typeof parsed.loaded === "number" ? parsed.loaded : undefined,
      total: typeof parsed.total === "number" ? parsed.total : undefined,
      message: typeof parsed.message === "string" ? parsed.message : undefined,
      meta: { event: event.event, id: event.id, retry: event.retry },
    };
  }

  if (event.event === "result" || (isRecord(parsed) && parsed.type === "result")) {
    return {
      type: "result",
      result: isRecord(parsed) && "result" in parsed ? parsed.result : parsed,
      meta: { event: event.event, id: event.id, retry: event.retry },
    };
  }

  if (event.event === "error" || (isRecord(parsed) && parsed.type === "error")) {
    return {
      type: "error",
      error: isRecord(parsed) && "error" in parsed ? parsed.error : parsed,
      meta: { event: event.event, id: event.id, retry: event.retry },
    };
  }

  if (isRecord(parsed) && typeof parsed.type === "string") {
    return parsed as unknown as TransportStreamEvent;
  }

  return {
    type: "chunk",
    chunk: parsed,
    meta: { event: event.event, id: event.id, retry: event.retry },
  };
};

export const defaultParse = async (response: Response): Promise<unknown> => {
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
