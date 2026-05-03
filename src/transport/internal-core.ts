// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { normalizeTransportCapabilities } from "./capabilities";
import type {
  SubmitRequest,
  Transport,
  TransportCapabilities,
  TransportSession,
  TransportStreamEvent,
} from "./types";

export type TransportEntry = {
  id: string | undefined;
  index: number;
  label: string;
  transport: Transport;
};

export type StreamFactory = (
  request: SubmitRequest,
) => AsyncIterable<TransportStreamEvent> | PromiseLike<AsyncIterable<TransportStreamEvent>>;

type SessionFactory = (request: SubmitRequest) => TransportSession | PromiseLike<TransportSession>;

export type AsyncQueue<T> = {
  push(value: T): void;
  close(): void;
  [Symbol.asyncIterator](): AsyncIterator<T>;
};

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const createTransport = (
  submit: Transport["submit"],
  stream?: StreamFactory,
  options?: {
    openSession?: SessionFactory;
    capabilities?: TransportCapabilities;
  },
): Transport => {
  const transport: Transport = { submit };
  if (stream) {
    transport.stream = stream;
  }
  if (options?.openSession) {
    transport.openSession = options.openSession;
  }
  transport.capabilities = normalizeTransportCapabilities(options?.capabilities, {
    modes: {
      submit: true,
      stream: Boolean(stream),
      session: Boolean(options?.openSession),
    },
    delivery: {
      mode: options?.openSession ? "session" : stream ? "stream" : "request-response",
      consistency: "unknown",
      backpressure: options?.openSession ? "bounded-buffer" : "none",
    },
  });
  return transport;
};

export const createAsyncQueue = <T>(): AsyncQueue<T> => {
  const values: T[] = [];
  const waiters: ((result: IteratorResult<T>) => void)[] = [];
  let closed = false;

  return {
    push(value) {
      if (closed) {
        return;
      }

      const waiter = waiters.shift();
      if (waiter) {
        waiter({ value, done: false });
        return;
      }

      values.push(value);
    },
    close() {
      if (closed) {
        return;
      }
      closed = true;
      while (waiters.length > 0) {
        waiters.shift()?.({ value: undefined as T, done: true });
      }
    },
    [Symbol.asyncIterator]() {
      return {
        next: () => {
          const value = values.shift();
          if (value !== undefined) {
            return Promise.resolve({ value, done: false });
          }

          if (closed) {
            return Promise.resolve({ value: undefined as T, done: true });
          }

          return new Promise<IteratorResult<T>>((resolve) => {
            waiters.push(resolve);
          });
        },
      };
    },
  };
};
