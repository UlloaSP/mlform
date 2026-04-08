// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type {
  AttachedDesignSystem,
  DesignSystemConfig,
  DesignSystemRegistry,
  ResolvedDesignSystem,
} from "@/design-system";
import type {
  FormController,
  FormHooks,
  FormSchema,
  FormValidator,
  Registry,
  SubmitRequest,
  Transport,
} from "@/engine";
import type { PrimitiveLayout, PrimitiveRegistry } from "@/primitives";

export interface KitLabels {
  form?: string;
  reports?: string;
  submit?: string;
  validating?: string;
  submitting?: string;
}

export interface JsonTransportOptions {
  endpoint: string | URL;
  fetch?: typeof globalThis.fetch;
  method?: string;
  headers?: HeadersInit;
  credentials?: RequestCredentials;
  body?: (request: SubmitRequest) => unknown;
  parse?: (response: Response) => Promise<unknown>;
}

export interface MountFormOptions {
  schema: FormSchema;
  endpoint?: string | URL;
  transport?: Transport;
  transportOptions?: Omit<JsonTransportOptions, "endpoint">;
  registry?: Registry;
  primitiveRegistry?: PrimitiveRegistry;
  designSystemRegistry?: DesignSystemRegistry;
  designSystem?: DesignSystemConfig;
  initialValues?: Record<string, unknown>;
  validators?: FormValidator[];
  hooks?: FormHooks;
  inactiveFieldPolicy?: "include" | "omit";
  layout?: PrimitiveLayout;
  reportPane?: "auto" | "always" | "hidden";
  labels?: KitLabels;
  onDesignSystemChange?: (resolved: ResolvedDesignSystem) => void;
}

export interface MountedForm {
  readonly form: FormController;
  readonly host: HTMLElement;
  readonly engineRegistry: Registry;
  readonly primitiveRegistry: PrimitiveRegistry;
  readonly designSystemRegistry: DesignSystemRegistry;
  readonly designSystem: AttachedDesignSystem;
  updateDesignSystem(config: DesignSystemConfig): void;
  replaceDesignSystem(config: DesignSystemConfig): void;
  resetDesignSystem(): void;
  unmount(): void;
}
