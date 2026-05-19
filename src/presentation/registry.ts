// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { RegistryError } from "@/schema";
import type { BaseFieldConfig, BaseReportConfig } from "@/schema";
import type { FieldPresenter, ReportPresenter } from "./index";

export class PresentationRegistry {
  private readonly fieldPresenters = new Map<string, FieldPresenter<BaseFieldConfig, unknown>>();
  private readonly reportPresenters = new Map<string, ReportPresenter<BaseReportConfig>>();

  registerField<TConfig extends BaseFieldConfig, TValue>(
    presenter: FieldPresenter<TConfig, TValue>,
  ): this {
    if (this.fieldPresenters.has(presenter.kind)) {
      throw new RegistryError(`Field presenter "${presenter.kind}" is already registered.`);
    }

    this.fieldPresenters.set(presenter.kind, presenter as FieldPresenter<BaseFieldConfig, unknown>);
    return this;
  }

  registerReport<TConfig extends BaseReportConfig>(presenter: ReportPresenter<TConfig>): this {
    if (this.reportPresenters.has(presenter.kind)) {
      throw new RegistryError(`Report presenter "${presenter.kind}" is already registered.`);
    }

    this.reportPresenters.set(presenter.kind, presenter as ReportPresenter<BaseReportConfig>);
    return this;
  }

  getField(kind: string): FieldPresenter<BaseFieldConfig, unknown> | undefined {
    return this.fieldPresenters.get(kind);
  }

  getReport(kind: string): ReportPresenter<BaseReportConfig> | undefined {
    return this.reportPresenters.get(kind);
  }

  clone(): PresentationRegistry {
    const next = new PresentationRegistry();
    for (const presenter of this.fieldPresenters.values()) next.registerField(presenter);
    for (const presenter of this.reportPresenters.values()) next.registerReport(presenter);
    return next;
  }
}

export const createPresentationRegistry = (): PresentationRegistry => new PresentationRegistry();
