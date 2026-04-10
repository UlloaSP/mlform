// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { EngineError } from "../errors";
import type { FormTransportConfig, SubmitOptions, Transport } from "../types";

export type ResolvedSubmitTransport = {
  backend?: string;
  transport: Transport;
};

export const resolveSubmitTransport = (
  config: FormTransportConfig,
  options?: SubmitOptions,
): ResolvedSubmitTransport => {
  if ("transport" in config && config.transport) {
    if (options?.backend) {
      throw new EngineError(
        `Transport backend "${options.backend}" cannot be selected for a single-transport form.`,
      );
    }

    return {
      transport: config.transport,
    };
  }

  const backend = options?.backend ?? config.defaultBackend;
  if (backend) {
    const selectedTransport = config.transports[backend];
    if (!selectedTransport) {
      throw new EngineError(`Unknown transport backend "${backend}".`);
    }

    return {
      backend,
      transport: selectedTransport,
    };
  }

  const availableTransports = Object.entries(config.transports);
  if (availableTransports.length === 1) {
    const [singleBackend, singleTransport] = availableTransports[0]!;
    return {
      backend: singleBackend,
      transport: singleTransport,
    };
  }

  throw new EngineError("No transport backend was configured for form submission.");
};
