// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type {
  FieldConfig,
  FieldStateSnapshot,
  FieldValidationFnContext,
  FieldValueAdapter,
  NormalizedFieldConfig,
} from "@/schema";
import type { ZodType } from "zod";

export interface FieldDescriptor {
  component: string;
  props: Record<string, unknown>;
  meta?: Record<string, unknown>;
}

export type FieldWidget = "text" | "number" | "boolean" | "select" | "date" | "series";
export type FieldRenderHints = Record<string, unknown>;

export interface FieldRenderSpecContext<
  TConfig extends FieldConfig = FieldConfig,
  TValue = unknown,
> {
  config: TConfig;
  fieldId: string;
  state: FieldStateSnapshot;
  value: TValue;
}

export interface FieldRenderSpec<TConfig extends FieldConfig = FieldConfig, TValue = unknown> {
  widget: FieldWidget;
  hints?:
    | FieldRenderHints
    | ((context: FieldRenderSpecContext<TConfig, TValue>) => FieldRenderHints);
}

export interface DeclarativeFieldKind<TConfig extends FieldConfig = FieldConfig, TValue = unknown> {
  kind: string;
  schema: ZodType<TConfig>;
  value?: FieldValueAdapter<TConfig, TValue>;
  validate?: (
    context: FieldValidationFnContext<TConfig, TValue>,
  ) => string[] | PromiseLike<string[]>;
  render: FieldRenderSpec<TConfig, TValue>;
}

export interface FieldDescriptorContext {
  fieldId: string;
  state: FieldStateSnapshot;
}

export interface FieldPresenter<TConfig extends FieldConfig = FieldConfig, TValue = unknown> {
  kind: string;
  describe(
    config: NormalizedFieldConfig<TConfig>,
    context: FieldDescriptorContext & { value: TValue },
  ): FieldDescriptor;
}
