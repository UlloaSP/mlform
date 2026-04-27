---
title: Protocol Adapters
description: Build or extend protocol adapters around MLForm's transport contract.
---

Built-in helpers:

- `createJsonTransport`
- `createGraphqlTransport`
- `createSseTransport`
- `createWebSocketSessionTransport`
- `createGrpcUnaryTransport`
- `createGrpcStreamTransport`
- `createGrpcSessionTransport`
- `createGrpcTransport`

Adapter guidance:

- set normalized capabilities explicitly
- preserve `request.signal`
- use canonical `TransportError` codes
- publish `stream()` for progressive output
- publish `openSession()` only for long-lived channels
- expose session backpressure metadata when relevant

If a protocol does not match a built-in helper, return a plain custom `transport`.
