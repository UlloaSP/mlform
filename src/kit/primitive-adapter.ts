// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import {
  primitiveTagNames,
  resolvePrimitiveText,
  type PrimitiveRegistry,
  type PrimitiveReportTransport,
  type PrimitiveTextOverrides,
} from "@/primitives";
import type { FormViewController, FormViewSnapshot } from "@/view";
import { resolvePrimitiveRegistry } from "./defaults";
import { createRegisteredHost } from "./shared/host-config";

export interface PrimitiveAdapterOptions {
  primitiveRegistry?: PrimitiveRegistry;
  primitiveText?: PrimitiveTextOverrides;
  reportTransport?: PrimitiveReportTransport;
}

export interface PrimitiveAdapter {
  mountField(slot: HTMLElement, id: string): HTMLElement;
  mountReport(slot: HTMLElement, id: string): HTMLElement;
  dispose(): void;
}

export const createPrimitiveAdapter = (
  view: FormViewController,
  options: PrimitiveAdapterOptions = {},
): PrimitiveAdapter => {
  const registry = resolvePrimitiveRegistry(options.primitiveRegistry);
  const text = resolvePrimitiveText(options.primitiveText);
  const fields = new Map<string, HTMLElementTagNameMap["mlf-field-frame"]>();
  const reports = new Map<string, HTMLElementTagNameMap["mlf-report-frame"]>();
  const slots = new Set<HTMLElement>();
  let disposed = false;

  const assertMountable = (slot: HTMLElement, id: string, role: "field" | "report"): void => {
    if (disposed) throw new Error("Primitive adapter is disposed.");
    if (slots.has(slot)) throw new TypeError("Slot already contains a mounted MLForm control.");
    if (role === "field" ? fields.has(id) : reports.has(id)) {
      throw new TypeError(`MLForm control "${id}" is already mounted.`);
    }
    const item = role === "field" ? view.getField(id) : view.getReport(id);
    if (!item) throw new TypeError(`Unknown ${role} "${id}".`);
  };

  const sync = (snapshot: FormViewSnapshot): void => {
    for (const field of snapshot.fields) {
      const frame = fields.get(field.id);
      if (!frame) continue;
      frame.descriptor = field.descriptor;
      frame.hidden = !field.visibleInLayout || !field.state.visible;
    }
    for (const report of snapshot.reports) {
      const frame = reports.get(report.id);
      if (!frame) continue;
      frame.descriptor = report.descriptor;
      frame.lastResult = snapshot.form.lastResult;
      frame.hidden = !report.visibleInLayout || report.descriptor === null;
    }
  };

  const unsubscribe = view.subscribe(sync);

  return {
    mountField(slot, id) {
      assertMountable(slot, id, "field");
      const field = view.getField(id);
      if (!field) throw new TypeError(`Unknown field "${id}".`);
      const frame = createRegisteredHost(
        slot.ownerDocument,
        primitiveTagNames.fieldFrame,
      ) as HTMLElementTagNameMap["mlf-field-frame"];
      frame.dataset.fieldId = id;
      frame.controller = field.controller;
      frame.registry = registry;
      frame.text = text;
      fields.set(id, frame);
      slots.add(slot);
      try {
        sync(view.getSnapshot());
        slot.append(frame);
      } catch (error) {
        fields.delete(id);
        slots.delete(slot);
        frame.remove();
        throw error;
      }
      return frame;
    },
    mountReport(slot, id) {
      assertMountable(slot, id, "report");
      const report = view.getReport(id);
      if (!report) throw new TypeError(`Unknown report "${id}".`);
      const frame = createRegisteredHost(
        slot.ownerDocument,
        primitiveTagNames.reportFrame,
      ) as HTMLElementTagNameMap["mlf-report-frame"];
      frame.dataset.reportId = id;
      frame.controller = report.controller;
      frame.registry = registry;
      frame.text = text;
      frame.transport = options.reportTransport;
      frame.fetchMode = view.reportFetchMode;
      reports.set(id, frame);
      slots.add(slot);
      try {
        sync(view.getSnapshot());
        slot.append(frame);
      } catch (error) {
        reports.delete(id);
        slots.delete(slot);
        frame.remove();
        throw error;
      }
      return frame;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      unsubscribe();
      const errors: unknown[] = [];
      for (const frame of [...fields.values(), ...reports.values()]) {
        try {
          frame.remove();
        } catch (error) {
          errors.push(error);
        }
      }
      fields.clear();
      reports.clear();
      slots.clear();
      if (errors.length === 1) throw errors[0];
      if (errors.length > 1) throw new AggregateError(errors, "Primitive adapter cleanup failed.");
    },
  };
};
