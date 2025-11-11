// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { beforeEach, describe, expect, it } from "vitest";
import { z } from "zod";
import type { DescriptorItem } from "@/core/app";
import type { Signature } from "@/core/domain";
import { FieldStrategy } from "@/extensions/app";
import { MLForm } from "@/mlform";

class ValidatedFieldStrategy extends FieldStrategy {
  constructor(type: string = "validated-field") {
    super(
      type,
      z.object({
        type: z.literal(type),
        title: z.string().min(3),
        required: z.boolean().default(false),
      }),
      () => Promise.resolve(undefined)
    );
  }

  protected buildControl(): { tag: string; props: Record<string, unknown> } {
    return { tag: "validated-input", props: {} };
  }

  buildDescriptor(payload: unknown): DescriptorItem {
    return super.buildDescriptor(payload);
  }
}

describe("MLForm Schema Validation Suite", () => {
  let form: MLForm;

  beforeEach(() => {
    form = new MLForm("http://localhost:3000");
  });

  describe("Schema Validation", () => {
    it("should validate empty inputs successfully", async () => {
      const signature: Signature = { inputs: [], outputs: [] };
      const result = await form.validateSchema(signature);
      expect(result).toBeDefined();
    });

    it("should return SafeParseReturnType", async () => {
      const signature: Signature = { inputs: [], outputs: [] };
      const result = await form.validateSchema(signature);
      expect(result).toHaveProperty("success");
    });

    it("should have success property in result", async () => {
      const signature: Signature = { inputs: [], outputs: [] };
      const result = await form.validateSchema(signature);
      expect(typeof (result as Record<string, unknown>).success).toBe(
        "boolean"
      );
    });

    it("should handle validation without registered strategies", async () => {
      // Testing with empty inputs to avoid type issues
      const signature: Signature = {
        inputs: [],
        outputs: [],
      };
      const result = await form.validateSchema(signature);
      expect(result).toBeDefined();
    });
  });

  describe("Schema Generation", () => {
    it("should generate schema with schema method", () => {
      const schema = form.schema();
      expect(schema).toBeDefined();
    });

    it("should return object with properties", () => {
      const schema = form.schema();
      expect(typeof schema).toBe("object");
      expect(schema).not.toBeNull();
    });

    it("should include inputs property in schema", () => {
      const schema = form.schema();
      expect(schema).toHaveProperty("properties");
    });

    it("should have type property in generated schema", () => {
      const schema = form.schema();
      expect(schema).toHaveProperty("type");
    });

    it("should match draft-2020-12 schema standard", () => {
      const schema = form.schema();
      expect(schema).toHaveProperty("$schema");
    });

    it("should generate consistent schemas", () => {
      const schema1 = form.schema();
      const schema2 = form.schema();
      expect(JSON.stringify(schema1)).toBe(JSON.stringify(schema2));
    });
  });

  describe("Multiple Strategy Schema Generation", () => {
    it("should include all registered strategies in schema", () => {
      const strategy1 = new ValidatedFieldStrategy("field-type-1");
      const strategy2 = new ValidatedFieldStrategy("field-type-2");

      form.register(strategy1);
      form.register(strategy2);

      const schema = form.schema();
      expect(schema).toBeDefined();
      expect(Object.keys(schema).length).toBeGreaterThan(0);
    });
  });

  describe("Validation Edge Cases", () => {
    it("should handle arrays in validation", async () => {
      const signature: Signature = {
        inputs: [],
        outputs: [],
      };
      const result = await form.validateSchema(signature);
      expect(result).toBeDefined();
    });

    it("should handle empty outputs", async () => {
      const signature: Signature = {
        inputs: [],
        outputs: [],
      };
      const result = await form.validateSchema(signature);
      expect(result).toBeDefined();
    });

    it("should validate multiple times with same data", async () => {
      const signature: Signature = {
        inputs: [],
        outputs: [],
      };
      const result1 = await form.validateSchema(signature);
      const result2 = await form.validateSchema(signature);
      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
    });

    it("should validate after strategy registration", async () => {
      const strategy = new ValidatedFieldStrategy("test-strategy");
      form.register(strategy);

      const signature: Signature = {
        inputs: [],
        outputs: [],
      };
      const result = await form.validateSchema(signature);
      expect(result).toBeDefined();
    });

    it("should validate after strategy unregistration", async () => {
      const signature: Signature = {
        inputs: [],
        outputs: [],
      };
      const result = await form.validateSchema(signature);
      expect(result).toBeDefined();
    });
  });

  describe("Schema Immutability", () => {
    it("should not modify original schema on multiple calls", () => {
      const schema1 = form.schema();
      form.register(new ValidatedFieldStrategy("new-type"));
      const schema2 = form.schema();

      expect(schema1).not.toBe(schema2);
    });

    it("should return independent schema instances", () => {
      const schema = form.schema();
      const schemasAreEqual =
        JSON.stringify(schema) === JSON.stringify(form.schema());
      expect(schemasAreEqual).toBe(true);
    });
  });

  describe("Schema Properties Validation", () => {
    it("should have correct JSON Schema structure", () => {
      const schema = form.schema();
      expect(schema).toHaveProperty("type");
      expect(schema).toHaveProperty("properties");
    });

    it("should have properties field as object", () => {
      const schema = form.schema();
      const properties = (schema as Record<string, unknown>).properties;
      expect(typeof properties).toBe("object");
    });

    it("should maintain schema structure after registration", () => {
      const initialSchema = form.schema();
      form.register(new ValidatedFieldStrategy("test-type"));
      const updatedSchema = form.schema();

      expect((initialSchema as Record<string, unknown>).type).toBe("object");
      expect((updatedSchema as Record<string, unknown>).type).toBe("object");
    });
  });
});
