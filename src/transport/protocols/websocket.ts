// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { normalizeTransportCapabilities } from "../capabilities";
import { transportErrorMessages } from "../constants";
import { TransportError, transportErrorCodes } from "../errors";
import { createAsyncQueue, isRecord, waitForDelay } from "../internal";
import { createSessionTransport } from "../state/session";
import type {
  TransportSessionEvent,
  TransportSessionMessage,
  WebSocketSessionTransportOptions,
} from "../types";

export const createWebSocketSessionTransport = (options: WebSocketSessionTransportOptions) => {
  const source = options.source ?? "websocket";

  return createSessionTransport({
    async openSession(request) {
      const WebSocketImpl = options.WebSocket ?? globalThis.WebSocket;
      if (typeof WebSocketImpl !== "function") {
        throw new TransportError(transportErrorMessages.websocketMissing, {
          source,
          code: "WEBSOCKET_MISSING",
          retryable: false,
        });
      }

      const resolvedUrl =
        options.url instanceof Function ? await options.url(request) : options.url;
      const resolvedProtocols =
        typeof options.protocols === "function"
          ? await options.protocols(request)
          : options.protocols;
      const serializeMessage =
        options.serializeMessage ??
        ((message: unknown) => JSON.stringify(message as TransportSessionMessage));
      const deserializeMessage =
        options.deserializeMessage ??
        (async (data: string | ArrayBuffer | Blob) => {
          if (typeof data === "string") {
            try {
              return JSON.parse(data);
            } catch {
              return data;
            }
          }

          if (data instanceof Blob) {
            const text = await data.text();
            try {
              return JSON.parse(text);
            } catch {
              return text;
            }
          }

          const text = new TextDecoder().decode(data);
          try {
            return JSON.parse(text);
          } catch {
            return text;
          }
        });

      const socket = new WebSocketImpl(String(resolvedUrl), resolvedProtocols);
      const queue = createAsyncQueue<TransportSessionEvent>();
      const bufferedMessages: TransportSessionEvent[] = [];
      const maxBufferedMessages = options.maxBufferedMessages ?? 1000;
      const bufferOverflow = options.bufferOverflow ?? "error";

      const sendPayload = (payload: string | ArrayBuffer | Blob | Uint8Array): void => {
        if (
          typeof payload === "string" ||
          payload instanceof Blob ||
          payload instanceof ArrayBuffer
        ) {
          socket.send(payload);
          return;
        }

        socket.send(payload.buffer as ArrayBuffer);
      };

      const pushBuffered = (event: TransportSessionEvent) => {
        if (bufferedMessages.length < maxBufferedMessages) {
          bufferedMessages.push(event);
          queue.push(event);
          return;
        }

        if (bufferOverflow === "drop-oldest") {
          bufferedMessages.shift();
          bufferedMessages.push(event);
          queue.push(event);
          return;
        }

        if (bufferOverflow === "drop-newest") {
          return;
        }

        if (bufferOverflow === "close") {
          socket.close(1013, "buffer-overflow");
          return;
        }

        queue.push({
          type: "error",
          error: new TransportError("WebSocket session buffer exceeded.", {
            source,
            code: transportErrorCodes.WEBSOCKET_BUFFER_OVERFLOW,
            retryable: false,
          }),
        });
      };

      await new Promise<void>((resolve, reject) => {
        socket.addEventListener("open", () => resolve(), { once: true });
        socket.addEventListener(
          "error",
          () =>
            reject(
              new TransportError("WebSocket failed to open.", {
                source,
                code: "WEBSOCKET_OPEN_FAILED",
                retryable: true,
              }),
            ),
          { once: true },
        );
      });

      socket.addEventListener("message", (event) => {
        void (async () => {
          const message = await deserializeMessage(event.data as string | ArrayBuffer | Blob);
          if (isRecord(message) && typeof message.type === "string") {
            const typedMessage = message as Record<string, unknown>;
            if (
              typedMessage.type === "progress" ||
              typedMessage.type === "meta" ||
              typedMessage.type === "result" ||
              typedMessage.type === "error"
            ) {
              pushBuffered(message as unknown as TransportSessionEvent);
              return;
            }
          }

          pushBuffered({
            type: "message",
            message: {
              type: "message",
              data: message,
            },
            meta: {
              session: true,
            },
          });
        })().catch((error) => {
          queue.push({
            type: "error",
            error,
          });
        });
      });

      socket.addEventListener("close", (event) => {
        queue.push({
          type: "close",
          reason: event.reason,
          meta: {
            code: event.code,
            wasClean: event.wasClean,
          },
        });
        queue.close();
      });

      const initMessage =
        typeof options.sessionInit === "function"
          ? await options.sessionInit(request)
          : options.sessionInit;
      if (initMessage) {
        sendPayload(serializeMessage(initMessage));
      }

      return {
        async send(message) {
          sendPayload(serializeMessage(message));
        },
        async *receive() {
          for await (const event of queue) {
            yield event;
          }
        },
        async close(reason) {
          if (socket.readyState === socket.CLOSING || socket.readyState === socket.CLOSED) {
            return;
          }

          socket.close(1000, reason);
          if ((options.closeTimeoutMs ?? 0) > 0) {
            await waitForDelay(options.closeTimeoutMs ?? 0);
          }
        },
        capabilities: {
          bufferedMessages: bufferedMessages.length,
          backpressure: "bounded-buffer" as const,
        },
      };
    },
    capabilities: normalizeTransportCapabilities(undefined, {
      modes: {
        submit: true,
        stream: true,
        session: true,
      },
      safety: {
        idempotent: false,
        retrySafe: false,
        cacheable: false,
        hedgeSafe: false,
      },
      limits: {
        maxBufferedMessages: options.maxBufferedMessages,
      },
      auth: {
        kinds: ["none", "bearer", "api-key", "transport-context", "custom"],
      },
      delivery: {
        mode: "session",
        consistency: "best-effort",
        backpressure: "bounded-buffer",
      },
    }),
  });
};
