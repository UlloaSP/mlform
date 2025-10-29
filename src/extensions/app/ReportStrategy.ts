// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { type DescriptorItem, DescriptorStrategy } from "@/core/app";
import type { Infer, Schema } from "@/core/domain";
export abstract class ReportStrategy<
  S extends Schema = Schema,
> extends DescriptorStrategy<S> {
  protected abstract buildControl(field: Infer<S>): {
    tag: string;
    props: Record<string, unknown>;
  };

  // @ts-ignore
  buildDescriptor(field: Infer<S>): DescriptorItem {
    return {
      ...this.buildControl(field),
      slot: "report",
    };
  }
}
