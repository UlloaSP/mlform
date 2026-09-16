---
title: Transport Capabilities
description: Understand the capabilities MLForm transports actually expose.
---

The public transport contract exposes asynchronous submission and cancellation through
`request.signal`. It does not advertise streaming, sessions, retry safety, caching, hedging, rate
limits, or authentication modes.

If an application needs those policies, configure them in its backend client and expose the final
operation as `submit(request)`. This keeps runtime orchestration deterministic and prevents MLForm
from claiming guarantees it cannot verify.
