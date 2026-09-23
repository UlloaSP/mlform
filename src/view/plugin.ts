// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { PrimitiveDescriptorRegistry } from "@/primitives";
import type { RuntimeBehavior } from "@/runtime";
import type { Registry } from "@/schema";

export interface MLFormFieldKind {
  readonly category: "field";
  readonly kind: string;
  register(registry: Registry, descriptorRegistry: PrimitiveDescriptorRegistry): void;
}

export interface MLFormReportKind {
  readonly category: "report";
  readonly kind: string;
  register(registry: Registry, descriptorRegistry: PrimitiveDescriptorRegistry): void;
}

export interface MLFormPlugin {
  readonly fields?: readonly MLFormFieldKind[];
  readonly reports?: readonly MLFormReportKind[];
  readonly behaviors?: readonly RuntimeBehavior[];
}

export const defineMLFormPlugin = (plugin: MLFormPlugin): MLFormPlugin => {
  const fields = [...(plugin.fields ?? [])];
  const reports = [...(plugin.reports ?? [])];
  const behaviors = [...(plugin.behaviors ?? [])];

  return Object.freeze({
    fields: Object.freeze(fields),
    reports: Object.freeze(reports),
    behaviors: Object.freeze(behaviors),
  });
};
