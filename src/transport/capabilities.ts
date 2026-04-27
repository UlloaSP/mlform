// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { TransportError, transportErrorCodes } from "./errors";
import type {
  CapabilityRequirement,
  SubmitRequest,
  Transport,
  TransportCapabilities,
} from "./types";

const emptyCapabilities: TransportCapabilities = {
  modes: {
    submit: true,
    stream: false,
    session: false,
  },
  safety: {
    idempotent: false,
    retrySafe: false,
    cacheable: false,
    hedgeSafe: false,
  },
  limits: {},
  auth: {
    kinds: ["none"],
  },
  delivery: {
    mode: "request-response",
    consistency: "unknown",
    backpressure: "none",
  },
};

const uniq = <T>(values: readonly T[]): readonly T[] => [...new Set(values)];

export const normalizeTransportCapabilities = (
  capabilities?: Partial<TransportCapabilities>,
  inferred?: Partial<TransportCapabilities>,
): TransportCapabilities => {
  const next = capabilities ?? {};
  const hint = inferred ?? {};
  const modes = {
    ...emptyCapabilities.modes,
    ...hint.modes,
    ...next.modes,
  };
  const session = Boolean(modes.session);
  const stream = Boolean(modes.stream);
  return {
    modes: {
      submit: modes.submit !== false,
      stream,
      session,
    },
    safety: {
      ...emptyCapabilities.safety,
      ...hint.safety,
      ...next.safety,
    },
    limits: {
      ...emptyCapabilities.limits,
      ...hint.limits,
      ...next.limits,
    },
    auth: {
      kinds: uniq([
        ...(hint.auth?.kinds ?? []),
        ...(next.auth?.kinds ?? emptyCapabilities.auth.kinds),
      ]),
    },
    delivery: {
      mode:
        next.delivery?.mode ??
        hint.delivery?.mode ??
        (session ? "session" : stream ? "stream" : "request-response"),
      consistency:
        next.delivery?.consistency ??
        hint.delivery?.consistency ??
        emptyCapabilities.delivery.consistency,
      backpressure:
        next.delivery?.backpressure ??
        hint.delivery?.backpressure ??
        emptyCapabilities.delivery.backpressure,
    },
  };
};

export const mergeTransportCapabilities = (
  current?: TransportCapabilities,
  next?: TransportCapabilities,
): TransportCapabilities | undefined => {
  if (!current && !next) {
    return undefined;
  }

  return normalizeTransportCapabilities(
    {
      modes: {
        submit: current?.modes.submit !== false && next?.modes.submit !== false,
        stream: Boolean(current?.modes.stream || next?.modes.stream),
        session: Boolean(current?.modes.session || next?.modes.session),
      },
      safety: {
        idempotent: Boolean(current?.safety.idempotent && next?.safety.idempotent),
        retrySafe: Boolean(current?.safety.retrySafe && next?.safety.retrySafe),
        cacheable: Boolean(current?.safety.cacheable && next?.safety.cacheable),
        hedgeSafe: Boolean(current?.safety.hedgeSafe && next?.safety.hedgeSafe),
      },
      limits: {
        maxPayloadBytes:
          current?.limits.maxPayloadBytes === undefined
            ? next?.limits.maxPayloadBytes
            : next?.limits.maxPayloadBytes === undefined
              ? current.limits.maxPayloadBytes
              : Math.min(current.limits.maxPayloadBytes, next.limits.maxPayloadBytes),
        maxBufferedMessages:
          current?.limits.maxBufferedMessages === undefined
            ? next?.limits.maxBufferedMessages
            : next?.limits.maxBufferedMessages === undefined
              ? current.limits.maxBufferedMessages
              : Math.min(current.limits.maxBufferedMessages, next.limits.maxBufferedMessages),
      },
      auth: {
        kinds: uniq([...(current?.auth.kinds ?? []), ...(next?.auth.kinds ?? [])]),
      },
      delivery: {
        mode: next?.delivery.mode ?? current?.delivery.mode ?? emptyCapabilities.delivery.mode,
        consistency:
          next?.delivery.consistency ??
          current?.delivery.consistency ??
          emptyCapabilities.delivery.consistency,
        backpressure:
          next?.delivery.backpressure ??
          current?.delivery.backpressure ??
          emptyCapabilities.delivery.backpressure,
      },
    },
    {
      modes: {
        submit: current?.modes.submit !== false && next?.modes.submit !== false,
        stream: Boolean(current?.modes.stream || next?.modes.stream),
        session: Boolean(current?.modes.session || next?.modes.session),
      },
    },
  );
};

export const inferTransportCapabilities = (
  transport: Pick<Transport, "stream" | "openSession" | "capabilities">,
): TransportCapabilities => {
  return normalizeTransportCapabilities(transport.capabilities, {
    modes: {
      submit: true,
      stream: transport.stream !== undefined,
      session: transport.openSession !== undefined,
    },
    delivery: {
      mode: transport.openSession ? "session" : transport.stream ? "stream" : "request-response",
      backpressure: transport.openSession ? "bounded-buffer" : "none",
      consistency: "unknown",
    },
  });
};

export const cloneCapabilities = (
  capabilities: TransportCapabilities | undefined,
): TransportCapabilities | undefined => {
  return capabilities
    ? normalizeTransportCapabilities(
        JSON.parse(JSON.stringify(capabilities)) as TransportCapabilities,
      )
    : undefined;
};

export const assertTransportCapabilities = (
  transport: Transport,
  requirement: CapabilityRequirement,
  context: string,
): void => {
  const capabilities = inferTransportCapabilities(transport);

  if (requirement.modes) {
    for (const [key, expected] of Object.entries(requirement.modes)) {
      if (
        expected !== undefined &&
        capabilities.modes[key as keyof TransportCapabilities["modes"]] !== expected
      ) {
        throw new TransportError(
          `${context}: transport does not satisfy mode "${key}=${expected}".`,
          {
            code: transportErrorCodes.CAPABILITY_MISMATCH,
            retryable: false,
            details: {
              requirement,
              capabilities,
            },
          },
        );
      }
    }
  }

  if (requirement.safety) {
    for (const [key, expected] of Object.entries(requirement.safety)) {
      if (
        expected !== undefined &&
        capabilities.safety[key as keyof TransportCapabilities["safety"]] !== expected
      ) {
        throw new TransportError(
          `${context}: transport does not satisfy safety "${key}=${expected}".`,
          {
            code: transportErrorCodes.CAPABILITY_MISMATCH,
            retryable: false,
            details: {
              requirement,
              capabilities,
            },
          },
        );
      }
    }
  }

  if (requirement.authKinds?.length) {
    const supported = new Set(capabilities.auth.kinds);
    for (const kind of requirement.authKinds) {
      if (!supported.has(kind)) {
        throw new TransportError(`${context}: transport does not support auth kind "${kind}".`, {
          code: transportErrorCodes.CAPABILITY_MISMATCH,
          retryable: false,
          details: {
            requirement,
            capabilities,
          },
        });
      }
    }
  }

  const maxPayloadBytes = requirement.maxPayloadBytes;
  if (
    maxPayloadBytes !== undefined &&
    capabilities.limits.maxPayloadBytes !== undefined &&
    capabilities.limits.maxPayloadBytes < maxPayloadBytes
  ) {
    throw new TransportError(
      `${context}: transport maxPayloadBytes ${capabilities.limits.maxPayloadBytes} is below required ${maxPayloadBytes}.`,
      {
        code: transportErrorCodes.CAPABILITY_MISMATCH,
        retryable: false,
        details: {
          requirement,
          capabilities,
        },
      },
    );
  }
};

export const assertPayloadWithinLimits = (
  transport: Transport,
  request: SubmitRequest,
  context: string,
): void => {
  const capabilities = inferTransportCapabilities(transport);
  const maxPayloadBytes = capabilities.limits.maxPayloadBytes;
  const estimatedPayloadBytes = request.metadata?.estimatedPayloadBytes;
  if (
    maxPayloadBytes !== undefined &&
    estimatedPayloadBytes !== undefined &&
    estimatedPayloadBytes > maxPayloadBytes
  ) {
    throw new TransportError(
      `${context}: estimated payload ${estimatedPayloadBytes} exceeds maxPayloadBytes ${maxPayloadBytes}.`,
      {
        code: transportErrorCodes.PAYLOAD_TOO_LARGE,
        retryable: false,
        details: {
          estimatedPayloadBytes,
          maxPayloadBytes,
          capabilities,
        },
      },
    );
  }
};
