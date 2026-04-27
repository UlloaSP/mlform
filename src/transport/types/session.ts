// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { TransportBackpressureMode } from "./capabilities";
import type { MaybePromise } from "./core";

export interface TransportSessionMessage {
  type: string;
  data?: unknown;
  meta?: Record<string, unknown>;
}

export interface TransportSessionProgressEvent {
  type: "progress";
  loaded?: number;
  total?: number;
  message?: string;
  meta?: Record<string, unknown>;
}

export interface TransportSessionMetaEvent {
  type: "meta";
  meta: Record<string, unknown>;
}

export interface TransportSessionMessageEvent {
  type: "message";
  message: TransportSessionMessage;
  meta?: Record<string, unknown>;
}

export interface TransportSessionResultEvent {
  type: "result";
  result: unknown;
  meta?: Record<string, unknown>;
}

export interface TransportSessionErrorEvent {
  type: "error";
  error: unknown;
  meta?: Record<string, unknown>;
}

export interface TransportSessionCloseEvent {
  type: "close";
  reason?: string;
  meta?: Record<string, unknown>;
}

export type TransportSessionEvent =
  | TransportSessionProgressEvent
  | TransportSessionMetaEvent
  | TransportSessionMessageEvent
  | TransportSessionResultEvent
  | TransportSessionErrorEvent
  | TransportSessionCloseEvent;

export interface TransportSession {
  send: (message: TransportSessionMessage) => MaybePromise<void>;
  receive: () =>
    | AsyncIterable<TransportSessionEvent>
    | PromiseLike<AsyncIterable<TransportSessionEvent>>;
  close: (reason?: string) => MaybePromise<void>;
  capabilities?: {
    bufferedMessages?: number;
    backpressure: TransportBackpressureMode;
  };
}
