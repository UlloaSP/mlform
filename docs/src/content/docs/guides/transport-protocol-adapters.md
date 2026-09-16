---
title: Protocol Adapters
description: Adapt an application protocol to MLForm's small transport contract.
---

Implement `Transport.submit` around the client you already use. Map `request.modelValues` to the
backend payload, forward `request.signal`, check protocol-level failures, and return data in the
report shape expected by the schema.

MLForm does not ship HTTP, GraphQL, SSE, WebSocket, or gRPC adapters. Those protocols have
application-specific authentication, framing, retry, and response contracts; keeping their
adapters local avoids hidden guesses.

For an HTTP example, see [Custom Transport](/mlform/examples/custom-transport/). For independent
named backends, use `createFanoutTransport` from `mlform/transport`.
