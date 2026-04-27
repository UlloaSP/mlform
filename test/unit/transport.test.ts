// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { describe, expect, it, vi } from "vite-plus/test";
import { TransportError, transportErrorCodes, type TransportStreamEvent } from "@/transport";
import {
  createFanoutTransport,
  createFallbackTransport,
  createGraphqlTransport,
  createGrpcTransport,
  createHedgedTransport,
  createJsonTransport,
  createLoadBalancedTransport,
  createMemoryTransportHealthState,
  createPipelineTransport,
  createQuorumFanoutTransport,
  createRacingTransport,
  createRoutingTransport,
  createSseTransport,
  createSessionTransport,
  createWebSocketSessionTransport,
  createWeightedRoutingTransport,
  withAuth,
  withCache,
  withCircuitBreaker,
  withDedup,
  withMetrics,
  withRateLimit,
  withRetry,
  withTracing,
} from "@/transport";

const baseRequest = {
  values: {},
  fieldValues: {},
  serializedValues: {},
  serializedFieldValues: {},
  fields: [],
  reports: [],
} as const;

describe("transport", () => {
  it("creates JSON transport with default body contract", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      headers: new Headers({ "content-type": "application/json" }),
      json: vi.fn().mockResolvedValue({ reports: { risk: { prediction: "high" } } }),
      text: vi.fn(),
    });
    const transport = createJsonTransport({
      endpoint: "https://api.example.com/predict",
      fetch: fetchMock as typeof globalThis.fetch,
    });

    await expect(
      transport.submit({
        ...baseRequest,
        values: { age: 34 },
        fieldValues: { age: 34 },
        serializedValues: { age: 34 },
        serializedFieldValues: { age: 34 },
      }),
    ).resolves.toEqual({
      reports: {
        risk: { prediction: "high" },
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
  });

  it("wraps HTTP failures as TransportError", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      statusText: "Service Unavailable",
      headers: new Headers({ "content-type": "application/json" }),
      json: vi.fn().mockResolvedValue({
        message: "backend offline",
        code: "BACKEND_OFFLINE",
      }),
      text: vi.fn(),
    });
    const transport = createJsonTransport({
      endpoint: "https://api.example.com/predict",
      source: "predict-api",
      fetch: fetchMock as typeof globalThis.fetch,
    });

    await expect(transport.submit(baseRequest)).rejects.toMatchObject({
      name: "TransportError",
      source: "predict-api",
      status: 503,
      code: "BACKEND_OFFLINE",
      retryable: true,
    });
  });

  it("injects auth and tracing headers", async () => {
    const submit = vi.fn().mockResolvedValue({ reports: {} });
    const emit = vi.fn();
    const transport = withMetrics({ emit })(
      withTracing({
        traceparent: "00-abc-123-01",
        baggage: "env=test",
      })(
        withAuth({
          type: "bearer",
          token: async () => "secret-token",
        })({
          submit,
        }),
      ),
    );

    await transport.submit(baseRequest);

    expect(emit).toHaveBeenCalledWith(expect.objectContaining({ kind: "request-start" }));
    expect(emit).toHaveBeenCalledWith(expect.objectContaining({ kind: "request-success" }));
    const headers = (submit.mock.calls[0]?.[0] as { transport?: { headers?: Headers } } | undefined)
      ?.transport?.headers;
    expect(headers?.get("authorization")).toBe("Bearer secret-token");
    expect(headers?.get("traceparent")).toBe("00-abc-123-01");
    expect(headers?.get("baggage")).toBe("env=test");
  });

  it("routes submissions to selected backend", async () => {
    const localSubmit = vi.fn().mockResolvedValue({ reports: { risk: { prediction: "local" } } });
    const remoteSubmit = vi.fn().mockResolvedValue({ reports: { risk: { prediction: "remote" } } });
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
      serializedValues: { mode: "local" },
    });
    await transport.submit({
      ...baseRequest,
      serializedValues: { mode: "remote" },
    });

    expect(localSubmit).toHaveBeenCalledTimes(1);
    expect(remoteSubmit).toHaveBeenCalledTimes(1);
  });

  it("fans out and merges reports", async () => {
    const transport = createFanoutTransport({
      transports: {
        primary: {
          submit: vi.fn().mockResolvedValue({
            reports: { risk: { prediction: "approved" } },
            meta: { model: "primary" },
          }),
        },
        shadow: {
          submit: vi.fn().mockResolvedValue({
            reports: { score: { value: 0.92 } },
            meta: { model: "shadow" },
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
          reports: { risk: { prediction: "approved" } },
          meta: { model: "primary" },
        },
        shadow: {
          reports: { score: { value: 0.92 } },
          meta: { model: "shadow" },
        },
      },
    });
  });

  it("falls back after failure", async () => {
    const transport = createFallbackTransport({
      transports: [
        { submit: vi.fn().mockRejectedValue(new Error("primary offline")) },
        { submit: vi.fn().mockResolvedValue({ reports: { risk: { prediction: "fallback" } } }) },
      ],
    });

    await expect(transport.submit(baseRequest)).resolves.toEqual({
      reports: {
        risk: { prediction: "fallback" },
      },
    });
  });

  it("dedups and caches requests", async () => {
    let resolveSubmit: ((value: unknown) => void) | undefined;
    const submit = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSubmit = resolve;
        }),
    );
    const deduped = withDedup()({ submit });
    const first = deduped.submit(baseRequest);
    const second = deduped.submit(baseRequest);
    resolveSubmit?.({ reports: { risk: { prediction: "high" } } });
    await expect(first).resolves.toEqual({ reports: { risk: { prediction: "high" } } });
    await expect(second).resolves.toEqual({ reports: { risk: { prediction: "high" } } });
    expect(submit).toHaveBeenCalledTimes(1);

    const cachedSubmit = vi.fn().mockResolvedValue({ reports: { risk: { prediction: "cached" } } });
    const cached = withCache({
      key: () => "same-request",
      ttl: 60_000,
      allowUnsafeCache: true,
    })({ submit: cachedSubmit });
    await cached.submit(baseRequest);
    await cached.submit(baseRequest);
    expect(cachedSubmit).toHaveBeenCalledTimes(1);
  });

  it("enforces circuit breaker and rate limit", async () => {
    const failing = withCircuitBreaker({
      failureThreshold: 2,
      resetTimeout: 60_000,
    })({
      submit: vi.fn().mockRejectedValue(new Error("offline")),
    });

    await expect(failing.submit(baseRequest)).rejects.toThrow("offline");
    await expect(failing.submit(baseRequest)).rejects.toThrow("offline");
    await expect(failing.submit(baseRequest)).rejects.toBeInstanceOf(TransportError);
    await expect(failing.submit(baseRequest)).rejects.toMatchObject({
      code: transportErrorCodes.OPEN_CIRCUIT,
    });

    let releaseFirst: (() => void) | undefined;
    const limitedSubmit = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          if (!releaseFirst) {
            releaseFirst = () => resolve({ reports: { first: true } });
            return;
          }
          resolve({ reports: { second: true } });
        }),
    );
    const limited = withRateLimit({
      maxConcurrent: 1,
    })({ submit: limitedSubmit });

    const first = limited.submit(baseRequest);
    const second = limited.submit(baseRequest);
    await Promise.resolve();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(limitedSubmit).toHaveBeenCalledTimes(1);
    releaseFirst?.();
    await first;
    await second;
    expect(limitedSubmit).toHaveBeenCalledTimes(2);
  });

  it("guards unsafe retry and cache middleware", () => {
    expect(() =>
      withRetry({ attempts: 2 })({
        submit: vi.fn(),
        capabilities: {
          modes: { submit: true, stream: false, session: false },
          safety: { idempotent: false, retrySafe: false, cacheable: false, hedgeSafe: false },
          limits: {},
          auth: { kinds: ["none"] },
          delivery: { mode: "request-response", consistency: "unknown", backpressure: "none" },
        },
      }),
    ).toThrow("withRetry: transport declares retrySafe=false");

    expect(() =>
      withCache({
        key: () => "same",
        ttl: 1000,
      })({
        submit: vi.fn(),
        capabilities: {
          modes: { submit: true, stream: false, session: false },
          safety: { idempotent: false, retrySafe: false, cacheable: false, hedgeSafe: false },
          limits: {},
          auth: { kinds: ["none"] },
          delivery: { mode: "request-response", consistency: "unknown", backpressure: "none" },
        },
      }),
    ).toThrow("withCache: transport declares cacheable=false");
  });

  it("supports JSON streaming", async () => {
    const transport = createJsonTransport({
      endpoint: "https://api.example.com/stream",
      fetch: vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: "OK",
        headers: new Headers({ "content-type": "text/event-stream" }),
      }) as typeof globalThis.fetch,
      stream: async function* () {
        yield { type: "progress", loaded: 1, total: 2 };
        yield { type: "result", result: { reports: { risk: { prediction: "live" } } } };
      },
    });

    const events: unknown[] = [];
    for await (const event of await transport.stream!(baseRequest)) {
      events.push(event);
    }

    expect(events).toEqual([
      { type: "progress", loaded: 1, total: 2 },
      { type: "result", result: { reports: { risk: { prediction: "live" } } } },
    ]);
  });

  it("supports fanout, pipeline, and racing streams", async () => {
    const fanout = createFanoutTransport({
      transports: {
        primary: {
          async *stream() {
            yield { type: "progress", loaded: 1, total: 2 };
            yield { type: "result", result: { reports: { risk: { prediction: "approved" } } } };
          },
          submit: vi.fn(),
        },
        secondary: {
          async *stream() {
            yield { type: "result", result: { reports: { score: { value: 0.91 } } } };
          },
          submit: vi.fn(),
        },
      },
    });
    const fanoutEvents: TransportStreamEvent[] = [];
    for await (const event of await fanout.stream!(baseRequest)) {
      fanoutEvents.push(event);
    }
    expect(fanoutEvents.at(-1)).toMatchObject({
      type: "result",
      result: {
        reports: {
          risk: { prediction: "approved" },
          score: { value: 0.91 },
        },
      },
    });

    const pipeline = createPipelineTransport({
      stages: [
        {
          id: "prepare",
          transport: {
            submit: vi.fn(),
            async *stream() {
              yield { type: "result", result: { prepared: true } };
            },
          },
          mapToNext: async (response, request) => ({
            ...request,
            serializedValues: {
              ...request.serializedValues,
              prepared: (response as { prepared: boolean }).prepared,
            },
          }),
        },
        {
          id: "predict",
          transport: {
            submit: vi.fn(),
            async *stream(request) {
              yield {
                type: "result",
                result: { reports: { risk: { prediction: request.serializedValues.prepared } } },
              };
            },
          },
        },
      ],
    });
    const pipelineEvents: TransportStreamEvent[] = [];
    for await (const event of await pipeline.stream!(baseRequest)) {
      pipelineEvents.push(event);
    }
    expect(pipelineEvents.at(-1)).toMatchObject({
      type: "result",
      result: { reports: { risk: { prediction: true } } },
    });

    const racing = createRacingTransport({
      transports: {
        slow: {
          submit: vi.fn(),
          async *stream() {
            await new Promise((resolve) => setTimeout(resolve, 20));
            yield { type: "result", result: { reports: { risk: { prediction: "slow" } } } };
          },
        },
        fast: {
          submit: vi.fn(),
          async *stream() {
            yield { type: "result", result: { reports: { risk: { prediction: "fast" } } } };
          },
        },
      },
    });
    const racingEvents: TransportStreamEvent[] = [];
    for await (const event of await racing.stream!(baseRequest)) {
      racingEvents.push(event);
    }
    expect(racingEvents).toContainEqual({
      type: "result",
      result: { reports: { risk: { prediction: "fast" } } },
      meta: expect.objectContaining({ source: "fast", selection: "first-success" }),
    });
  });

  it("supports session-backed submit", async () => {
    const send = vi.fn();
    const close = vi.fn();
    const transport = createSessionTransport({
      openSession: async () => ({
        send,
        close,
        async *receive() {
          yield {
            type: "message",
            message: {
              type: "token",
              data: "hello",
            },
          };
          yield {
            type: "result",
            result: { reports: { risk: { prediction: "live" } } },
          };
        },
      }),
    });

    await expect(transport.submit(baseRequest)).resolves.toEqual({
      reports: { risk: { prediction: "live" } },
    });
    const session = await transport.openSession!(baseRequest);
    await session.send({ type: "prompt", data: "go" });
    await session.close("done");
    expect(send).toHaveBeenCalledWith({ type: "prompt", data: "go" });
    expect(close).toHaveBeenCalledWith("done");
  });

  it("supports weighted routing, quorum fanout, load balancing, and hedging", async () => {
    const local = vi.fn().mockResolvedValue({ reports: { risk: { prediction: "local" } } });
    const remote = vi.fn().mockResolvedValue({ reports: { risk: { prediction: "remote" } } });
    const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0.95);
    const weighted = createWeightedRoutingTransport({
      transports: {
        local: { submit: local },
        remote: { submit: remote },
      },
      weights: {
        local: 1,
        remote: 9,
      },
    });
    await weighted.submit(baseRequest);
    expect(local).not.toHaveBeenCalled();
    expect(remote).toHaveBeenCalledTimes(1);
    randomSpy.mockRestore();

    const quorum = createQuorumFanoutTransport({
      transports: {
        primary: {
          submit: vi.fn().mockResolvedValue({ reports: { risk: { prediction: "approved" } } }),
        },
        secondary: {
          submit: vi.fn().mockRejectedValue(new Error("offline")),
        },
      },
      quorum: 2,
    });
    await expect(quorum.submit(baseRequest)).rejects.toMatchObject({
      code: "QUORUM_NOT_REACHED",
    });

    const health = createMemoryTransportHealthState<"a" | "b">();
    await health.recordFailure("transport", "a", new Error("offline"));
    const a = vi.fn().mockResolvedValue({ reports: { risk: { prediction: "a" } } });
    const b = vi.fn().mockResolvedValue({ reports: { risk: { prediction: "b" } } });
    const healthRandomSpy = vi.spyOn(Math, "random").mockReturnValue(0.7);
    const balanced = createLoadBalancedTransport({
      transports: { a: { submit: a }, b: { submit: b } },
      strategy: "health-weighted",
      healthState: health,
      weights: { a: 1, b: 1 },
    });
    await balanced.submit(baseRequest);
    expect(a).not.toHaveBeenCalled();
    expect(b).toHaveBeenCalledTimes(1);
    healthRandomSpy.mockRestore();

    const slow = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve({ reports: { risk: { prediction: "slow" } } }), 30);
        }),
    );
    const fast = vi.fn().mockResolvedValue({ reports: { risk: { prediction: "fast" } } });
    const hedged = createHedgedTransport({
      transports: {
        slow: { submit: slow },
        fast: { submit: fast },
      },
      hedgeDelayMs: 1,
      allowUnsafeHedging: true,
    });
    await expect(hedged.submit(baseRequest)).resolves.toEqual({
      reports: { risk: { prediction: "fast" } },
    });
  });

  it("supports GraphQL, SSE, WebSocket, and gRPC adapters", async () => {
    const graphqlFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      headers: new Headers({ "content-type": "application/json" }),
      json: vi.fn().mockResolvedValue({
        data: {
          reports: {
            risk: {
              prediction: "graphql",
            },
          },
        },
      }),
      text: vi.fn(),
    });
    const graphql = createGraphqlTransport({
      endpoint: "https://api.example.com/graphql",
      fetch: graphqlFetch as typeof globalThis.fetch,
      query: "query Predict($input: JSON!) { predict(input: $input) }",
      variables: async (request) => ({
        input: request.serializedValues,
      }),
    });
    await expect(
      graphql.submit({
        ...baseRequest,
        serializedValues: {
          age: 34,
        },
      }),
    ).resolves.toEqual({
      reports: {
        risk: {
          prediction: "graphql",
        },
      },
    });

    const encoder = new TextEncoder();
    const sseStream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(
          encoder.encode(
            'event: progress\ndata: {"loaded":1,"total":2}\n\n' +
              'event: result\ndata: {"result":{"reports":{"risk":{"prediction":"sse"}}}}\n\n',
          ),
        );
        controller.close();
      },
    });
    const sse = createSseTransport({
      endpoint: "https://api.example.com/stream",
      fetch: vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: "OK",
        body: sseStream,
        headers: new Headers({ "content-type": "text/event-stream" }),
      }) as typeof globalThis.fetch,
    });
    const sseEvents: TransportStreamEvent[] = [];
    for await (const event of await sse.stream!(baseRequest)) {
      sseEvents.push(event);
    }
    expect(sseEvents.at(-1)).toMatchObject({
      type: "result",
      result: { reports: { risk: { prediction: "sse" } } },
    });

    class FakeSocket extends EventTarget {
      static instances: FakeSocket[] = [];
      static readonly OPEN = 1;
      static readonly CLOSING = 2;
      static readonly CLOSED = 3;
      readyState = FakeSocket.OPEN;
      sent: unknown[] = [];
      CLOSING = FakeSocket.CLOSING;
      CLOSED = FakeSocket.CLOSED;

      constructor(_url: string, _protocols?: string | string[]) {
        super();
        FakeSocket.instances.push(this);
        queueMicrotask(() => this.dispatchEvent(new Event("open")));
      }

      send(data: unknown) {
        this.sent.push(data);
      }

      close(code = 1000, reason?: string) {
        this.readyState = FakeSocket.CLOSED;
        this.dispatchEvent(new CloseEvent("close", { code, reason, wasClean: true }));
      }
    }

    const websocket = createWebSocketSessionTransport({
      url: "wss://example.test/socket",
      WebSocket: FakeSocket as never,
    });
    const session = await websocket.openSession!(baseRequest);
    const socket = FakeSocket.instances[0]!;
    socket.dispatchEvent(
      new MessageEvent("message", {
        data: JSON.stringify({
          hello: "world",
        }),
      }),
    );
    const received = (async () => {
      for await (const event of await session.receive()) {
        if (event.type === "message") {
          return event.message.data;
        }
      }
    })();
    await session.send({ type: "prompt", data: "go" });
    expect(socket.sent).toContain(JSON.stringify({ type: "prompt", data: "go" }));
    await expect(received).resolves.toEqual({ hello: "world" });

    const grpc = createGrpcTransport({
      unary: vi.fn().mockResolvedValue({ reports: { risk: { prediction: "grpc" } } }),
      capabilities: {
        modes: { submit: true, stream: false, session: false },
        safety: { idempotent: false, retrySafe: true, cacheable: false, hedgeSafe: false },
        limits: {},
        auth: { kinds: ["transport-context"] },
        delivery: { mode: "request-response", consistency: "unknown", backpressure: "none" },
      },
    });
    await expect(grpc.submit(baseRequest)).resolves.toEqual({
      reports: {
        risk: {
          prediction: "grpc",
        },
      },
    });
  });
});
