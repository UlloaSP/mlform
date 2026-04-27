// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { TransportError, transportErrorCodes } from "../errors";
import { getErrorMessage, resolveSecret, withRequestTransportContext } from "../internal";
import { withRequestTransform } from "./transform";
import type { AuthOptions, TransportMiddleware } from "../types";

export const withAuth = (options: AuthOptions): TransportMiddleware => {
  if (options.type === "custom") {
    return withRequestTransform(async (request) => {
      try {
        return await options.apply(request);
      } catch (error) {
        throw new TransportError(getErrorMessage(error), {
          cause: error,
          code: transportErrorCodes.AUTH_FAILED,
          retryable: false,
        });
      }
    });
  }

  if (options.type === "transport-context") {
    return withRequestTransform(async (request) => {
      const context =
        typeof options.context === "function" ? await options.context() : options.context;
      return withRequestTransportContext(request, context);
    });
  }

  return withRequestTransform(async (request) => {
    try {
      const header = options.header ?? (options.type === "bearer" ? "authorization" : "x-api-key");
      const prefix =
        options.type === "bearer" ? (options.prefix ?? "Bearer ") : (options.prefix ?? "");
      const secret = await resolveSecret(options.type === "bearer" ? options.token : options.key);

      return withRequestTransportContext(request, {
        headers: new Headers([[header, `${prefix}${secret}`]]),
      });
    } catch (error) {
      throw new TransportError(getErrorMessage(error), {
        cause: error,
        code: transportErrorCodes.AUTH_FAILED,
        retryable: false,
      });
    }
  });
};
