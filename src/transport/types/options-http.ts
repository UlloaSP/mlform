// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { TransportCapabilities } from "./capabilities";
import type { MaybePromise, SubmitRequest } from "./core";
import type { TransportStreamEvent } from "./events";
import type { TransportSession, TransportSessionMessage } from "./session";

export type JsonTransportMethod = "POST" | "PUT" | "PATCH" | "DELETE";

export interface JsonTransportOptions {
  endpoint: string | URL;
  source?: string;
  fetch?: typeof globalThis.fetch;
  method?: JsonTransportMethod;
  headers?: HeadersInit | (() => MaybePromise<HeadersInit>);
  credentials?: RequestCredentials;
  body?: (request: SubmitRequest) => BodyInit | null | undefined;
  parse?: (response: Response) => Promise<unknown>;
  stream?: (
    response: Response,
    request: SubmitRequest,
  ) => MaybePromise<AsyncIterable<TransportStreamEvent>>;
}

export interface GraphqlTransportOptions {
  endpoint: string | URL;
  source?: string;
  fetch?: typeof globalThis.fetch;
  query: string | ((request: SubmitRequest) => MaybePromise<string>);
  operationName?: string | ((request: SubmitRequest) => MaybePromise<string | undefined>);
  variables?: (request: SubmitRequest) => MaybePromise<Record<string, unknown>>;
  headers?: HeadersInit | (() => MaybePromise<HeadersInit>);
  credentials?: RequestCredentials;
  parse?: (response: Response) => Promise<unknown>;
  resultPath?: "data" | `data.${string}`;
  resolveResult?: (payload: unknown, request: SubmitRequest) => MaybePromise<unknown>;
}

export interface SseTransportOptions {
  endpoint: string | URL;
  source?: string;
  fetch?: typeof globalThis.fetch;
  method?: "POST" | "PUT" | "PATCH";
  headers?: HeadersInit | (() => MaybePromise<HeadersInit>);
  credentials?: RequestCredentials;
  body?: (request: SubmitRequest) => BodyInit | null | undefined;
  decodeEvent?: (
    event: {
      id?: string;
      event?: string;
      data: string;
      retry?: number;
    },
    request: SubmitRequest,
  ) => MaybePromise<TransportStreamEvent>;
  resultEvent?:
    | string
    | ((event: { id?: string; event?: string; data: string; retry?: number }) => boolean);
  maxPayloadBytes?: number;
}

export interface WebSocketSessionTransportOptions {
  url: string | URL | ((request: SubmitRequest) => MaybePromise<string | URL>);
  source?: string;
  WebSocket?: typeof globalThis.WebSocket;
  protocols?: string | string[] | ((request: SubmitRequest) => MaybePromise<string | string[]>);
  serializeMessage?: (message: unknown) => string | ArrayBuffer | Blob | Uint8Array;
  deserializeMessage?: (data: string | ArrayBuffer | Blob) => MaybePromise<unknown>;
  sessionInit?:
    | TransportSessionMessage
    | ((request: SubmitRequest) => MaybePromise<TransportSessionMessage | undefined>);
  closeTimeoutMs?: number;
  maxBufferedMessages?: number;
  bufferOverflow?: "close" | "drop-oldest" | "drop-newest" | "error";
}

export interface GrpcUnaryTransportOptions {
  source?: string;
  unary?: (request: SubmitRequest) => MaybePromise<unknown>;
  capabilities?: TransportCapabilities;
}

export interface GrpcStreamTransportOptions {
  source?: string;
  stream: (request: SubmitRequest) => MaybePromise<AsyncIterable<TransportStreamEvent>>;
  capabilities?: TransportCapabilities;
}

export interface GrpcSessionTransportOptions {
  source?: string;
  session: (request: SubmitRequest) => MaybePromise<TransportSession>;
  capabilities?: TransportCapabilities;
}

export interface GrpcTransportOptions {
  source?: string;
  unary?: (request: SubmitRequest) => MaybePromise<unknown>;
  stream?: (request: SubmitRequest) => MaybePromise<AsyncIterable<TransportStreamEvent>>;
  session?: (request: SubmitRequest) => MaybePromise<TransportSession>;
  capabilities?: TransportCapabilities;
}
