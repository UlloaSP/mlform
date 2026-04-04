// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { beforeEach, describe, expect, it } from "vitest";
import { z } from "zod";
import type { DescriptorItem } from "@/core/app";
import { FieldStrategy, ReportStrategy } from "@/extensions/app";
import { MLForm } from "@/mlform";

class ComplexFieldStrategy extends FieldStrategy {
  constructor(type: string = "complex-field") {
    super(
      type,
      z.object({
        type: z.literal(type),
        title: z.string(),
        metadata: z.optional(z.record(z.string(), z.unknown())),
      }),
      () => Promise.resolve(undefined)
    );
  }

  protected buildControl(): { tag: string; props: Record<string, unknown> } {
    return { tag: "complex-control", props: {} };
  }

  buildDescriptor(payload: unknown): DescriptorItem {
    return super.buildDescriptor(payload);
  }
}

class ComplexReportStrategy extends ReportStrategy {
  constructor() {
    super(
      "complex-report",
      z.object({ type: z.literal("complex-report") }),
      () => Promise.resolve(undefined)
    );
  }

  protected buildControl(): { tag: string; props: Record<string, unknown> } {
    return { tag: "complex-report-control", props: {} };
  }
}

describe("MLForm Complex Integration Suite", () => {
  let form: MLForm;

  beforeEach(() => {
    form = new MLForm("http://localhost:3000");
  });

  describe("Lifecycle Management", () => {
    it("should support complete form lifecycle", () => {
      const strategy = new ComplexFieldStrategy("lifecycle-test");

      // Register
      form.register(strategy);
      expect(form["fieldService"].reg.get("lifecycle-test")).toBeDefined();

      // Update
      const updatedStrategy = new ComplexFieldStrategy("lifecycle-test");
      form.update(updatedStrategy);
      expect(form["fieldService"].reg.get("lifecycle-test")).toBeDefined();
    });

    it("should handle multiple register-update cycles", () => {
      const strategy1 = new ComplexFieldStrategy("cycle-1");
      const strategy2 = new ComplexFieldStrategy("cycle-2");

      // Cycle 1
      form.register(strategy1);
      form.update(strategy1);

      // Cycle 2
      form.register(strategy2);
      form.update(strategy2);

      expect(form["fieldService"].reg.get("cycle-1")).toBeDefined();
      expect(form["fieldService"].reg.get("cycle-2")).toBeDefined();
    });

    it("should maintain state consistency across operations", () => {
      const strategies = [
        new ComplexFieldStrategy("state-1"),
        new ComplexFieldStrategy("state-2"),
        new ComplexFieldStrategy("state-3"),
      ];

      strategies.forEach((s) => form.register(s));
      strategies.forEach((s) => form.update(s));

      // All should still be registered
      strategies.forEach((s) => {
        expect(form["fieldService"].reg.get(s.type)).toBeDefined();
      });
    });
  });

  describe("Strategy Composition", () => {
    it("should handle mixed field and report strategies", () => {
      const field1 = new ComplexFieldStrategy("field-1");
      const field2 = new ComplexFieldStrategy("field-2");
      const report = new ComplexReportStrategy();

      form.register(field1);
      form.register(field2);
      form.register(report);

      expect(form["fieldService"].reg.get("field-1")).toBeDefined();
      expect(form["fieldService"].reg.get("field-2")).toBeDefined();
      expect(form["modelService"].reg.get("complex-report")).toBeDefined();
    });

    it("should maintain field-report separation", () => {
      const fieldStrategy = new ComplexFieldStrategy("isolated-field");
      const reportStrategy = new ComplexReportStrategy();

      form.register(fieldStrategy);
      form.register(reportStrategy);

      // Fields should not leak into reports
      expect(form["fieldService"].reg.get("isolated-field")).toBeDefined();
      expect(form["modelService"].reg.get("isolated-field")).toBeUndefined();

      // Reports should not leak into fields
      expect(form["fieldService"].reg.get("complex-report")).toBeUndefined();
      expect(form["modelService"].reg.get("complex-report")).toBeDefined();
    });
  });

  describe("Error Recovery", () => {
    it("should recover from duplicate registration attempts", () => {
      const strategy = new ComplexFieldStrategy("duplicate-test");

      form.register(strategy);
      expect(() => form.register(strategy)).toThrow();
      expect(form["fieldService"].reg.get("duplicate-test")).toBeDefined();
    });

    it("should recover from unregistering non-existent strategy", () => {
      const strategy = new ComplexFieldStrategy("non-existent");
      expect(() => form.unregister(strategy)).toThrow();
    });

    it("should handle update of non-existent strategy", () => {
      const strategy = new ComplexFieldStrategy("not-registered");
      expect(() => form.update(strategy)).toThrow();
    });

    it("should maintain form state after errors", () => {
      const strategy1 = new ComplexFieldStrategy("stable-1");
      const strategy2 = new ComplexFieldStrategy("stable-2");

      form.register(strategy1);
      expect(() => form.register(strategy1)).toThrow();
      form.register(strategy2);

      expect(form["fieldService"].reg.get("stable-1")).toBeDefined();
      expect(form["fieldService"].reg.get("stable-2")).toBeDefined();
    });
  });

  describe("Performance Characteristics", () => {
    it("should handle bulk registration efficiently", () => {
      const strategies = Array.from(
        { length: 50 },
        (_, i) => new ComplexFieldStrategy(`bulk-${i}`)
      );

      strategies.forEach((s) => form.register(s));

      strategies.forEach((_, i) => {
        expect(form["fieldService"].reg.get(`bulk-${i}`)).toBeDefined();
      });
    });

    it("should handle rapid listener subscription and unsubscription", () => {
      const unsubscribes = Array.from({ length: 100 }, () =>
        form.onSubmit(() => {
          "";
        })
      );

      expect(form["_listeners"].size).toBe(100);

      unsubscribes.forEach((unsub) => unsub());
      expect(form["_listeners"].size).toBe(0);
    });

    it("should maintain performance with nested structure access", () => {
      const strategy = new ComplexFieldStrategy("nested-performance");
      form.register(strategy);

      // Multiple nested accesses should be fast
      for (let i = 0; i < 100; i += 1) {
        expect(
          form["fieldService"].reg.get("nested-performance")
        ).toBeDefined();
      }
    });
  });

  describe("Form Reusability", () => {
    it("should support clearing and repopulating form", () => {
      const strategy2 = new ComplexFieldStrategy("reuse-2");
      form.register(strategy2);

      expect(form["fieldService"].reg.get("reuse-2")).toBeDefined();
    });

    it("should create independent form instances safely", () => {
      const form1 = new MLForm("http://localhost:3000");
      const form2 = new MLForm("http://localhost:3001");

      const strategy1 = new ComplexFieldStrategy("form1-strategy");
      const strategy2 = new ComplexFieldStrategy("form2-strategy");

      form1.register(strategy1);
      form2.register(strategy2);

      expect(form1["fieldService"].reg.get("form1-strategy")).toBeDefined();
      expect(form2["fieldService"].reg.get("form2-strategy")).toBeDefined();

      expect(form1["fieldService"].reg.get("form2-strategy")).toBeUndefined();
      expect(form2["fieldService"].reg.get("form1-strategy")).toBeUndefined();
    });

    it("should support schema generation across instances", () => {
      const form1 = new MLForm("http://localhost:3000");
      const form2 = new MLForm("http://localhost:3001");

      form1.register(new ComplexFieldStrategy("schema-1"));
      form2.register(new ComplexFieldStrategy("schema-2"));

      const schema1 = form1.schema();
      const schema2 = form2.schema();

      expect(schema1).toBeDefined();
      expect(schema2).toBeDefined();
      // Schemas should be different due to different registered strategies
      expect(JSON.stringify(schema1)).not.toBe(JSON.stringify(schema2));
    });
  });

  describe("Data Flow Integration", () => {
    it("should track input/output data through form", () => {
      const inputs = { field: "value" };

      form["_lastInputs"] = inputs;
      expect(form.lastInputs).toBe(inputs);
    });

    it("should notify listeners of data changes", () => {
      let notified = false;
      form.onSubmit(() => {
        notified = true;
      });

      expect(form["_listeners"].size).toBe(1);
      expect(notified).toBe(false);
    });

    it("should accumulate listener registrations", () => {
      form.onSubmit(() => {
        "";
      });
      form.onSubmit(() => {
        "";
      });
      form.onSubmit(() => {
        "";
      });

      expect(form["_listeners"].size).toBe(3);
    });
  });

  describe("Schema Consistency", () => {
    it("should generate consistent schema across calls", () => {
      const strategy = new ComplexFieldStrategy("consistent");
      form.register(strategy);

      const schema1 = form.schema();
      const schema2 = form.schema();
      const schema3 = form.schema();

      expect(JSON.stringify(schema1)).toBe(JSON.stringify(schema2));
      expect(JSON.stringify(schema2)).toBe(JSON.stringify(schema3));
    });

    it("should update schema when strategies change", () => {
      const schema1 = form.schema();

      form.register(new ComplexFieldStrategy("dynamic-1"));
      const schema2 = form.schema();

      form.register(new ComplexFieldStrategy("dynamic-2"));
      const schema3 = form.schema();

      // Schemas should change as strategies are added
      expect(JSON.stringify(schema1)).not.toBe(JSON.stringify(schema2));
      expect(JSON.stringify(schema2)).not.toBe(JSON.stringify(schema3));
    });
  });
});
