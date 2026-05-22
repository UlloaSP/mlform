// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

export interface ReportDescriptor {
  component: string;
  props: Record<string, unknown>;
  meta?: Record<string, unknown>;
}

export interface ReportDescriptorState {
  status: string;
  error: string | null;
  payload: unknown;
}

export interface ReportDescriptorContext {
  reportId: string;
  state: ReportDescriptorState;
  payload: unknown;
  result: object | null;
}

export interface ReportPresenter<TConfig = unknown> {
  kind: string;
  describe(config: TConfig, context: ReportDescriptorContext): ReportDescriptor | null;
}
