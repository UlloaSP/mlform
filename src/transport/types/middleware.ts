// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { Transport } from "./core";

export type TransportMiddleware = (transport: Transport) => Transport;

export type TransportCollection<TTransportId extends string = string> =
  | Record<TTransportId, Transport>
  | readonly Transport[];
