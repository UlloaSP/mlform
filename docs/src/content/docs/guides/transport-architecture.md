---
title: Transport Architecture
description: How MLForm models transports, middleware, orchestration, and policy backends.
---

MLForm transport has four layers:

1. Core contract:
   - `submit(request)`
   - `stream(request)?`
   - `openSession(request)?`
2. Capability model:
   - `modes`
   - `safety`
   - `limits`
   - `auth`
   - `delivery`
3. Middleware:
   - auth
   - retry
   - timeout
   - circuit breaker
   - rate limit
   - dedup
   - cache
   - tracing
   - metrics
4. Orchestration:
   - routing
   - weighted routing
   - fanout
   - quorum fanout
   - fallback
   - pipeline
   - racing
   - hedged
   - load balancing

The engine is protocol-agnostic. HTTP, GraphQL, SSE, WebSocket, gRPC, local inference, workers, or custom RPC all fit as long as the transport implements the contract.

Policy logic is scoped through `TransportPolicyContext`. Shared cache, rate limit, breaker, and health backends should key decisions by `scope`, not by ad hoc local strings.
