// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { FieldPresenter, ReportPresenter } from "./index";

export class PrimitiveDescriptorRegistry {
  private readonly fieldPresenters = new Map<string, FieldPresenter<unknown, unknown>>();
  private readonly reportPresenters = new Map<string, ReportPresenter<unknown>>();

  registerField<TConfig, TValue>(presenter: FieldPresenter<TConfig, TValue>): this {
    if (this.fieldPresenters.has(presenter.kind)) {
      throw new Error(`Field descriptor presenter "${presenter.kind}" is already registered.`);
    }

    this.fieldPresenters.set(presenter.kind, presenter as FieldPresenter<unknown, unknown>);
    return this;
  }

  registerReport<TConfig>(presenter: ReportPresenter<TConfig>): this {
    if (this.reportPresenters.has(presenter.kind)) {
      throw new Error(`Report descriptor presenter "${presenter.kind}" is already registered.`);
    }

    this.reportPresenters.set(presenter.kind, presenter as ReportPresenter<unknown>);
    return this;
  }

  getField(kind: string): FieldPresenter<unknown, unknown> | undefined {
    return this.fieldPresenters.get(kind);
  }

  getReport(kind: string): ReportPresenter<unknown> | undefined {
    return this.reportPresenters.get(kind);
  }

  clone(): PrimitiveDescriptorRegistry {
    const next = new PrimitiveDescriptorRegistry();
    for (const presenter of this.fieldPresenters.values()) next.registerField(presenter);
    for (const presenter of this.reportPresenters.values()) next.registerReport(presenter);
    return next;
  }
}

export const createPrimitiveDescriptorRegistry = (): PrimitiveDescriptorRegistry =>
  new PrimitiveDescriptorRegistry();
