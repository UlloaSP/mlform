// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

export interface FieldDescriptor {
  component: string;
  props: Record<string, unknown>;
  meta?: Record<string, unknown>;
}

export type FieldWidget = "text" | "number" | "boolean" | "select" | "date" | "series";
export type FieldRenderHints = Record<string, unknown>;

export interface FieldDescriptorState {
  status: string;
  errors: readonly string[];
  value?: unknown;
}

export interface FieldRenderSpecContext<TConfig = unknown, TValue = unknown> {
  config: TConfig;
  fieldId: string;
  state: FieldDescriptorState;
  value: TValue;
}

export interface FieldRenderSpec<TConfig = unknown, TValue = unknown> {
  widget: FieldWidget;
  hints?:
    | FieldRenderHints
    | ((context: FieldRenderSpecContext<TConfig, TValue>) => FieldRenderHints);
}

export interface FieldDescriptorContext {
  fieldId: string;
  state: FieldDescriptorState;
}

export interface FieldPresenter<TConfig = unknown, TValue = unknown> {
  kind: string;
  describe(config: TConfig, context: FieldDescriptorContext & { value: TValue }): FieldDescriptor;
}
