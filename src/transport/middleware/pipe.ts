// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { Transport, TransportMiddleware } from "../types";

export const pipe = (transport: Transport, ...middleware: TransportMiddleware[]): Transport => {
  return middleware.reduce((current, next) => next(current), transport);
};
