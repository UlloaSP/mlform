// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { cloneCapabilities, inferTransportCapabilities } from "../capabilities";
import { transportErrorMessages } from "../constants";
import { TransportError, transportErrorCodes } from "../errors";
import { combineSignals, createTransport, resolveStream } from "../internal";
import type { TransportMiddleware } from "../types";

export const withTimeout = (ms: number): TransportMiddleware => {
  if (ms <= 0 || !Number.isFinite(ms)) {
    throw new TypeError(transportErrorMessages.timeoutInvalid);
  }

  return (transport) =>
    createTransport(
      async (request) => {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(`Transport timed out after ${ms}ms`), ms);

        const { signal, cleanup } = combineSignals([request.signal, controller.signal]);

        try {
          return await transport.submit({ ...request, signal });
        } catch (error) {
          if (controller.signal.aborted && !request.signal?.aborted) {
            throw new TransportError(`Transport timed out after ${ms}ms`, {
              cause: error,
              code: transportErrorCodes.TIMEOUT,
              retryable: true,
            });
          }
          throw error;
        } finally {
          clearTimeout(timer);
          cleanup();
        }
      },
      transport.stream
        ? async function* (request) {
            const controller = new AbortController();
            const timer = setTimeout(
              () => controller.abort(`Transport timed out after ${ms}ms`),
              ms,
            );
            const { signal, cleanup } = combineSignals([request.signal, controller.signal]);

            try {
              const stream = await resolveStream(transport, { ...request, signal });
              for await (const event of stream) {
                yield event;
              }
            } catch (error) {
              if (controller.signal.aborted && !request.signal?.aborted) {
                throw new TransportError(`Transport timed out after ${ms}ms`, {
                  cause: error,
                  code: transportErrorCodes.TIMEOUT,
                  retryable: true,
                });
              }
              throw error;
            } finally {
              clearTimeout(timer);
              cleanup();
            }
          }
        : undefined,
      {
        openSession: transport.openSession
          ? async (request) => {
              const controller = new AbortController();
              const timer = setTimeout(
                () => controller.abort(`Transport timed out after ${ms}ms`),
                ms,
              );
              const { signal, cleanup } = combineSignals([request.signal, controller.signal]);
              try {
                const session = await transport.openSession!({ ...request, signal });
                return {
                  send: session.send,
                  receive: session.receive,
                  close: async (reason?: string) => {
                    clearTimeout(timer);
                    cleanup();
                    await session.close(reason);
                  },
                  capabilities: session.capabilities,
                };
              } catch (error) {
                clearTimeout(timer);
                cleanup();
                if (controller.signal.aborted && !request.signal?.aborted) {
                  throw new TransportError(`Transport timed out after ${ms}ms`, {
                    cause: error,
                    code: transportErrorCodes.TIMEOUT,
                    retryable: true,
                  });
                }
                throw error;
              }
            }
          : undefined,
        capabilities: cloneCapabilities(inferTransportCapabilities(transport)),
      },
    );
};
