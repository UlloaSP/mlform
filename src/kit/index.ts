// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

export { defaultKitDesignSystem, defaultKitLabels } from "./defaults";
export { mountForm, unmountForm } from "./mount-form";
export {
  createFanoutTransport,
  createFallbackTransport,
  createJsonTransport,
  createRoutingTransport,
} from "./transport";
export type {
  FanoutTransportOptions,
  FanoutTransportResult,
  FallbackTransportFailure,
  FallbackTransportOptions,
  JsonTransportMethod,
  JsonTransportOptions,
  KitDesignSystemSnapshot,
  KitLabels,
  MountFormOptions,
  MountedForm,
  RoutingTransportOptions,
  TransportCollection,
} from "./types";
