// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { beforeEach, describe, expect, it } from "vitest";
import { z } from "zod";
import { FieldStrategy, ReportStrategy } from "@/extensions/app";

class SimpleFieldStrategy extends FieldStrategy {
  buildControl() {
    return {
      tag: "input",
      props: { type: "text" },
    };
  }
}

class SimpleReportStrategy extends ReportStrategy {
  buildControl() {
    return {
      tag: "div",
      props: { className: "report" },
    };
  }
}

const schema = z.object({
  title: z.string(),
  description: z.string().optional(),
});

describe("Strategy Extensions", () => {
  describe("FieldStrategy", () => {
    let strategy: SimpleFieldStrategy;

    beforeEach(() => {
      strategy = new SimpleFieldStrategy("test-field", schema, async () => ({
        data: "test",
      }));
    });

    it("should create FieldStrategy", () => {
      expect(strategy).toBeDefined();
      expect(strategy.type).toBe("test-field");
    });

    it("should build descriptor with field-wrapper", () => {
      const descriptor = strategy.buildDescriptor({
        title: "Test",
        description: "Test",
      });
      expect(descriptor.tag).toBe("field-wrapper");
      expect(descriptor.slot).toBe("inputs");
    });

    it("should have nested child descriptor", () => {
      const descriptor = strategy.buildDescriptor({
        title: "Test",
        description: "Test",
      });
      expect(descriptor.child?.tag).toBe("input");
      expect(descriptor.child?.slot).toBe("inputs");
    });

    it("should set title and description in wrapper props", () => {
      const descriptor = strategy.buildDescriptor({
        title: "Username",
        description: "Enter username",
      });
      expect(descriptor.props?.title).toBe("Username");
      expect(descriptor.props?.description).toBe("Enter username");
    });

    it("should default description to empty string", () => {
      const descriptor = strategy.buildDescriptor({ title: "Test" });
      expect(descriptor.props?.description).toBe("");
    });

    it("should inherit from DescriptorStrategy", () => {
      expect(strategy.schema).toBe(schema);
      expect(typeof strategy.validate).toBe("function");
      expect(typeof strategy.parse).toBe("function");
    });

    it("should have loader property", () => {
      expect(typeof strategy.loader).toBe("function");
    });
  });

  describe("ReportStrategy", () => {
    let strategy: SimpleReportStrategy;

    beforeEach(() => {
      strategy = new SimpleReportStrategy("test-report", schema, async () => ({
        data: "report",
      }));
    });

    it("should create ReportStrategy", () => {
      expect(strategy).toBeDefined();
      expect(strategy.type).toBe("test-report");
    });

    it("should build descriptor without wrapping", () => {
      const descriptor = strategy.buildDescriptor({
        title: "Test",
        description: "Test",
      });
      expect(descriptor.tag).toBe("div");
      expect(descriptor.slot).toBe("report");
    });

    it("should not have field-wrapper", () => {
      const descriptor = strategy.buildDescriptor({
        title: "Test",
        description: "Test",
      });
      expect(descriptor.tag).not.toBe("field-wrapper");
    });

    it("should pass control properties directly", () => {
      const descriptor = strategy.buildDescriptor({
        title: "Test",
        description: "Test",
      });
      expect(descriptor.props?.className).toBe("report");
    });

    it("should use report slot", () => {
      const descriptor = strategy.buildDescriptor({
        title: "Test",
        description: "Test",
      });
      expect(descriptor.slot).toBe("report");
    });

    it("should inherit validation methods", () => {
      expect(typeof strategy.validate).toBe("function");
      expect(typeof strategy.parse).toBe("function");
    });
  });

  describe("Differences between Strategies", () => {
    const fieldStrategy = new SimpleFieldStrategy(
      "field",
      schema,
      async () => ({})
    );
    const reportStrategy = new SimpleReportStrategy(
      "report",
      schema,
      async () => ({})
    );

    it("FieldStrategy wraps, ReportStrategy does not", () => {
      const fieldDesc = fieldStrategy.buildDescriptor({
        title: "F",
        description: "F",
      });
      const reportDesc = reportStrategy.buildDescriptor({
        title: "R",
        description: "R",
      });

      expect(fieldDesc.tag).toBe("field-wrapper");
      expect(reportDesc.tag).toBe("div");
    });

    it("FieldStrategy uses inputs slot, ReportStrategy uses report", () => {
      const fieldDesc = fieldStrategy.buildDescriptor({
        title: "F",
        description: "F",
      });
      const reportDesc = reportStrategy.buildDescriptor({
        title: "R",
        description: "R",
      });

      expect(fieldDesc.slot).toBe("inputs");
      expect(reportDesc.slot).toBe("report");
    });

    it("Both have child/control but structure differs", () => {
      const fieldDesc = fieldStrategy.buildDescriptor({
        title: "F",
        description: "F",
      });
      const reportDesc = reportStrategy.buildDescriptor({
        title: "R",
        description: "R",
      });

      expect(fieldDesc.child).toBeDefined();
      expect(reportDesc.child).toBeUndefined();
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty title", () => {
      const strategy = new SimpleFieldStrategy(
        "field",
        schema,
        async () => ({})
      );
      const descriptor = strategy.buildDescriptor({ title: "" });
      expect(descriptor.props?.title).toBe("");
    });

    it("should handle very long description", () => {
      const strategy = new SimpleFieldStrategy(
        "field",
        schema,
        async () => ({})
      );
      const longDesc = "x".repeat(1000);
      const descriptor = strategy.buildDescriptor({
        title: "Test",
        description: longDesc,
      });
      expect(descriptor.props?.description).toBe(longDesc);
    });

    it("should handle special characters in title", () => {
      const strategy = new SimpleFieldStrategy(
        "field",
        schema,
        async () => ({})
      );
      const descriptor = strategy.buildDescriptor({
        title: "Test@#$%^&*()",
        description: "x",
      });
      expect(descriptor.props?.title).toBe("Test@#$%^&*()");
    });

    it("should handle null-like values", () => {
      const strategy = new SimpleFieldStrategy(
        "field",
        schema,
        async () => ({})
      );
      const descriptor = strategy.buildDescriptor({
        title: "Test",
        description: undefined,
      });
      expect(descriptor.props?.description).toBe("");
    });
  });

  describe("Schema Integration", () => {
    it("FieldStrategy should have accessible schema", () => {
      const strategy = new SimpleFieldStrategy(
        "field",
        schema,
        async () => ({})
      );
      expect(strategy.schema).toBe(schema);
    });

    it("ReportStrategy should have accessible schema", () => {
      const strategy = new SimpleReportStrategy(
        "report",
        schema,
        async () => ({})
      );
      expect(strategy.schema).toBe(schema);
    });

    it("Both should be able to validate", () => {
      const fieldStrategy = new SimpleFieldStrategy(
        "field",
        schema,
        async () => ({})
      );
      const reportStrategy = new SimpleReportStrategy(
        "report",
        schema,
        async () => ({})
      );

      expect(typeof fieldStrategy.validate).toBe("function");
      expect(typeof reportStrategy.validate).toBe("function");
    });

    it("Both should be able to parse", () => {
      const fieldStrategy = new SimpleFieldStrategy(
        "field",
        schema,
        async () => ({})
      );
      const reportStrategy = new SimpleReportStrategy(
        "report",
        schema,
        async () => ({})
      );

      expect(typeof fieldStrategy.parse).toBe("function");
      expect(typeof reportStrategy.parse).toBe("function");
    });
  });

  describe("Loader Functionality", () => {
    it("should accept async loader", () => {
      const loader = async () => {
        return { component: "loaded" };
      };
      const strategy = new SimpleFieldStrategy("field", schema, loader);
      expect(strategy.loader).toBe(loader);
    });

    it("should be callable", async () => {
      const loader = async () => ({ result: "success" });
      const strategy = new SimpleFieldStrategy("field", schema, loader);
      const result = await strategy.loader();
      expect(result).toEqual({ result: "success" });
    });
  });
});
