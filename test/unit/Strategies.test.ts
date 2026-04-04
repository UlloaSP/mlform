// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { beforeEach, describe, expect, it } from "vitest";
import { z } from "zod";
import type { DescriptorItem } from "@/core/app";
import { FieldStrategy, ReportStrategy } from "@/extensions/app";

// Test implementations
class TestFieldStrategy extends FieldStrategy {
  buildControl() {
    return {
      tag: "input",
      props: {
        type: "text",
        placeholder: "Enter text",
      },
    };
  }
}

class TestReportStrategy extends ReportStrategy {
  buildControl() {
    return {
      tag: "div",
      props: {
        className: "report-container",
      },
    };
  }
}

const testSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
});

const testLoader = async () => ({ data: "test" });

describe("FieldStrategy", () => {
  let fieldStrategy: TestFieldStrategy;

  beforeEach(() => {
    fieldStrategy = new TestFieldStrategy(
      "test-field-input",
      testSchema,
      testLoader
    );
  });

  describe("Initialization", () => {
    it("should create FieldStrategy instance", () => {
      expect(fieldStrategy).toBeDefined();
      expect(fieldStrategy).toBeInstanceOf(FieldStrategy);
    });

    it("should have type property", () => {
      expect(fieldStrategy.type).toBe("test-field-input");
    });

    it("should have schema property", () => {
      expect(fieldStrategy.schema).toBe(testSchema);
    });

    it("should have loader function", () => {
      expect(typeof fieldStrategy.loader).toBe("function");
    });
  });

  describe("buildDescriptor", () => {
    it("should build descriptor with field-wrapper tag", () => {
      const fieldData = {
        title: "Test Input",
        description: "A test input field",
      };
      const descriptor = fieldStrategy.buildDescriptor(fieldData);

      expect(descriptor.tag).toBe("field-wrapper");
      expect(descriptor.slot).toBe("inputs");
    });

    it("should set title property from field data", () => {
      const fieldData = {
        title: "Username",
        description: "Enter your username",
      };
      const descriptor = fieldStrategy.buildDescriptor(fieldData);

      expect(descriptor.props?.title).toBe("Username");
    });

    it("should set description from field data", () => {
      const fieldData = { title: "Email", description: "Your email address" };
      const descriptor = fieldStrategy.buildDescriptor(fieldData);

      expect(descriptor.props?.description).toBe("Your email address");
    });

    it("should use empty string for missing description", () => {
      const fieldData = { title: "Field Name" };
      const descriptor = fieldStrategy.buildDescriptor(fieldData);

      expect(descriptor.props?.description).toBe("");
    });

    it("should include child control in descriptor", () => {
      const fieldData = { title: "Input Field", description: "Test" };
      const descriptor = fieldStrategy.buildDescriptor(fieldData);

      expect(descriptor.child).toBeDefined();
      expect(descriptor.child?.tag).toBe("input");
    });

    it("should set inputs slot on child control", () => {
      const fieldData = { title: "Test", description: "Test" };
      const descriptor = fieldStrategy.buildDescriptor(fieldData);

      expect(descriptor.child?.slot).toBe("inputs");
    });
  });

  describe("buildControl", () => {
    it("should return control object with tag and props", () => {
      const control = fieldStrategy.buildControl();

      expect(control.tag).toBe("input");
      expect(control.props).toBeDefined();
    });

    it("should set input type to text", () => {
      const control = fieldStrategy.buildControl();

      expect(control.props.type).toBe("text");
    });

    it("should set placeholder property", () => {
      const control = fieldStrategy.buildControl();

      expect(control.props.placeholder).toBe("Enter text");
    });
  });

  describe("DescriptorItem Structure", () => {
    it("should produce valid DescriptorItem", () => {
      const fieldData = { title: "Valid Field", description: "A valid field" };
      const descriptor = fieldStrategy.buildDescriptor(
        fieldData
      ) as DescriptorItem;

      expect(descriptor).toHaveProperty("tag");
      expect(descriptor).toHaveProperty("props");
      expect(descriptor).toHaveProperty("slot");
      expect(descriptor).toHaveProperty("child");
    });

    it("should nest field-wrapper with input control", () => {
      const fieldData = { title: "Nested Test", description: "Test nesting" };
      const descriptor = fieldStrategy.buildDescriptor(fieldData);

      expect(descriptor.tag).toBe("field-wrapper");
      expect(descriptor.child?.tag).toBe("input");
    });
  });

  describe("Schema Validation", () => {
    it("should validate correct schema data", () => {
      expect(fieldStrategy.schema).toBeDefined();
    });

    it("should have validate method", () => {
      expect(typeof fieldStrategy.validate).toBe("function");
    });

    it("should have parse method", () => {
      expect(typeof fieldStrategy.parse).toBe("function");
    });
  });
});

describe("ReportStrategy", () => {
  let reportStrategy: TestReportStrategy;

  beforeEach(() => {
    reportStrategy = new TestReportStrategy(
      "test-report-output",
      testSchema,
      testLoader
    );
  });

  describe("Initialization", () => {
    it("should create ReportStrategy instance", () => {
      expect(reportStrategy).toBeDefined();
      expect(reportStrategy).toBeInstanceOf(ReportStrategy);
    });

    it("should have type property", () => {
      expect(reportStrategy.type).toBe("test-report-output");
    });

    it("should have schema property", () => {
      expect(reportStrategy.schema).toBe(testSchema);
    });

    it("should have loader function", () => {
      expect(typeof reportStrategy.loader).toBe("function");
    });
  });

  describe("buildDescriptor", () => {
    it("should build descriptor without wrapper", () => {
      const reportData = { title: "Results", description: "Report results" };
      const descriptor = reportStrategy.buildDescriptor(reportData);

      expect(descriptor.tag).toBe("div");
      expect(descriptor.slot).toBe("report");
    });

    it("should set report slot", () => {
      const reportData = { title: "Output", description: "Output data" };
      const descriptor = reportStrategy.buildDescriptor(reportData);

      expect(descriptor.slot).toBe("report");
    });

    it("should include props from buildControl", () => {
      const reportData = { title: "Data", description: "Data output" };
      const descriptor = reportStrategy.buildDescriptor(reportData);

      expect(descriptor.props).toBeDefined();
      expect(descriptor.props?.className).toBe("report-container");
    });
  });

  describe("buildControl", () => {
    it("should return control object with tag and props", () => {
      const control = reportStrategy.buildControl();

      expect(control.tag).toBe("div");
      expect(control.props).toBeDefined();
    });

    it("should set className property", () => {
      const control = reportStrategy.buildControl();

      expect(control.props.className).toBe("report-container");
    });
  });

  describe("DescriptorItem Structure", () => {
    it("should produce valid DescriptorItem", () => {
      const reportData = {
        title: "Valid Report",
        description: "A valid report",
      };
      const descriptor = reportStrategy.buildDescriptor(
        reportData
      ) as DescriptorItem;

      expect(descriptor).toHaveProperty("tag");
      expect(descriptor).toHaveProperty("props");
      expect(descriptor).toHaveProperty("slot");
    });

    it("should use report slot", () => {
      const reportData = { title: "Slot Test", description: "Test slots" };
      const descriptor = reportStrategy.buildDescriptor(reportData);

      expect(descriptor.slot).toBe("report");
    });
  });

  describe("Differences from FieldStrategy", () => {
    it("FieldStrategy should wrap control in field-wrapper", () => {
      const fieldData = { title: "Field", description: "Field desc" };
      const fieldStrategy = new TestFieldStrategy(
        "test-field",
        testSchema,
        testLoader
      );
      const fieldDescriptor = fieldStrategy.buildDescriptor(fieldData);

      expect(fieldDescriptor.tag).toBe("field-wrapper");
    });

    it("ReportStrategy should not wrap control", () => {
      const reportData = { title: "Report", description: "Report desc" };
      const reportDescriptor = reportStrategy.buildDescriptor(reportData);

      expect(reportDescriptor.tag).toBe("div");
      expect(reportDescriptor.tag).not.toBe("field-wrapper");
    });

    it("FieldStrategy should use inputs slot", () => {
      const fieldData = { title: "Field", description: "Field desc" };
      const fieldStrategy = new TestFieldStrategy(
        "test-field",
        testSchema,
        testLoader
      );
      const fieldDescriptor = fieldStrategy.buildDescriptor(fieldData);

      expect(fieldDescriptor.slot).toBe("inputs");
    });

    it("ReportStrategy should use report slot", () => {
      const reportData = { title: "Report", description: "Report desc" };
      const reportDescriptor = reportStrategy.buildDescriptor(reportData);

      expect(reportDescriptor.slot).toBe("report");
    });
  });
});
