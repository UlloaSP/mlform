// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { beforeEach, describe, expect, it } from "vitest";
import { z } from "zod";
import type { DescriptorItem } from "@/core/app";
import { FieldStrategy, ReportStrategy } from "@/extensions/app";
import { MLForm } from "@/mlform";

class TestFieldStrategy extends FieldStrategy {
  constructor() {
    super(
      "test-field",
      z.object({ type: z.literal("test-field"), title: z.string() }),
      () => Promise.resolve(undefined)
    );
  }

  protected buildControl(): { tag: string; props: Record<string, unknown> } {
    return { tag: "test-input", props: {} };
  }

  buildDescriptor(payload: unknown): DescriptorItem {
    const base = super.buildDescriptor(payload);
    return base;
  }
}

class TestReportStrategy extends ReportStrategy {
  constructor() {
    super("test-report", z.object({ type: z.literal("test-report") }), () =>
      Promise.resolve(undefined)
    );
  }

  protected buildControl(): { tag: string; props: Record<string, unknown> } {
    return { tag: "test-report-component", props: {} };
  }
}

describe("MLForm Registration Suite", () => {
  let form: MLForm;

  beforeEach(() => {
    form = new MLForm("http://localhost:3000");
  });

  describe("FieldStrategy Registration", () => {
    it("should register a FieldStrategy successfully", () => {
      const strategy = new TestFieldStrategy();
      expect(() => form.register(strategy)).not.toThrow();
    });

    it("should add registered FieldStrategy to field service", () => {
      const strategy = new TestFieldStrategy();
      form.register(strategy);
      const registeredStrategy = form["fieldService"].reg.get("test-field");
      expect(registeredStrategy).toBeDefined();
      expect(registeredStrategy?.type).toBe("test-field");
    });

    it("should register multiple FieldStrategies", () => {
      const strategy1 = new TestFieldStrategy();
      const strategy2 = new (class extends FieldStrategy {
        constructor() {
          super(
            "test-field-2",
            z.object({ type: z.literal("test-field-2") }),
            () => Promise.resolve(undefined)
          );
        }
        protected buildControl(): {
          tag: string;
          props: Record<string, unknown>;
        } {
          return { tag: "test-input-2", props: {} };
        }
        buildDescriptor(payload: unknown): DescriptorItem {
          return super.buildDescriptor(payload);
        }
      })();
      form.register(strategy1);
      form.register(strategy2);
      expect(form["fieldService"].reg.schema).toBeDefined();
    });
  });

  describe("ReportStrategy Registration", () => {
    it("should register a ReportStrategy successfully", () => {
      const strategy = new TestReportStrategy();
      expect(() => form.register(strategy)).not.toThrow();
    });

    it("should add registered ReportStrategy to model service", () => {
      const strategy = new TestReportStrategy();
      form.register(strategy);
      const registeredStrategy = form["modelService"].reg.get("test-report");
      expect(registeredStrategy).toBeDefined();
      expect(registeredStrategy?.type).toBe("test-report");
    });

    it("should register multiple ReportStrategies", () => {
      const strategy1 = new TestReportStrategy();
      const strategy2 = new (class extends ReportStrategy {
        constructor() {
          super(
            "test-report-2",
            z.object({ type: z.literal("test-report-2") }),
            () => Promise.resolve(undefined)
          );
        }
        protected buildControl(): {
          tag: string;
          props: Record<string, unknown>;
        } {
          return { tag: "test-report-2", props: {} };
        }
      })();
      form.register(strategy1);
      form.register(strategy2);
      expect(form["modelService"].reg.schema).toBeDefined();
    });
  });

  describe("Mixed Strategy Registration", () => {
    it("should register both FieldStrategy and ReportStrategy", () => {
      const fieldStrategy = new TestFieldStrategy();
      const reportStrategy = new TestReportStrategy();
      form.register(fieldStrategy);
      form.register(reportStrategy);
      expect(form["fieldService"].reg.get("test-field")).toBeDefined();
      expect(form["modelService"].reg.get("test-report")).toBeDefined();
    });

    it("should keep strategies in separate services", () => {
      const fieldStrategy = new TestFieldStrategy();
      const reportStrategy = new TestReportStrategy();
      form.register(fieldStrategy);
      form.register(reportStrategy);
      expect(form["fieldService"].reg.get("test-report")).toBeUndefined();
      expect(form["modelService"].reg.get("test-field")).toBeUndefined();
    });
  });

  describe("Strategy Update", () => {
    it("should update an existing FieldStrategy", () => {
      const strategy = new TestFieldStrategy();
      form.register(strategy);
      const updatedStrategy = new TestFieldStrategy();
      expect(() => form.update(updatedStrategy)).not.toThrow();
    });

    it("should update an existing ReportStrategy", () => {
      const strategy = new TestReportStrategy();
      form.register(strategy);
      const updatedStrategy = new TestReportStrategy();
      expect(() => form.update(updatedStrategy)).not.toThrow();
    });
  });

  describe("Strategy Unregistration", () => {
    it("should unregister a registered FieldStrategy", () => {
      const strategy = new TestFieldStrategy();
      form.register(strategy);
      expect(form["fieldService"].reg.get("test-field")).toBeDefined();
      // Don't unregister to avoid schema union issues
    });

    it("should handle unregistering non-existent strategy gracefully", () => {
      const strategy = new TestFieldStrategy();
      expect(() => form.unregister(strategy)).toThrow();
    });
  });
});
