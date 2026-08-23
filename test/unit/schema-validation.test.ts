// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { describe, expect, it } from "vitest";
import { z } from "zod";
import { createMlRegistryPack } from "@/builtins";
import { createRegistry, findUnknownKinds, toSchemaJsonSchema, validateSchema } from "@/schema";

const registry = createMlRegistryPack().registry;

const unresolvedLocalRefs = (schema: Record<string, unknown>): string[] => {
  const refs: string[] = [];

  const visit = (value: unknown): void => {
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    if (typeof value !== "object" || value === null) return;

    const record = value as Record<string, unknown>;
    if (typeof record.$ref === "string") {
      refs.push(record.$ref);
    }
    Object.values(record).forEach(visit);
  };

  visit(schema);
  return refs.filter((ref) => {
    if (ref === "#") return false;
    if (!ref.startsWith("#/")) return true;

    let current: unknown = schema;
    for (const encodedPart of ref.slice(2).split("/")) {
      const part = encodedPart.replaceAll("~1", "/").replaceAll("~0", "~");
      if (typeof current !== "object" || current === null || !(part in current)) return true;
      current = (current as Record<string, unknown>)[part];
    }
    return false;
  });
};

describe("schema validation tooling", () => {
  it("normalizes a valid schema and builds JSON Schema from the registry", () => {
    const result = validateSchema(
      { fields: [{ kind: "text", label: "Prompt", mappedTo: "prompt" }] },
      registry,
    );

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.fields[0]?.id).toBe("prompt");

    const jsonSchema = toSchemaJsonSchema(registry);
    expect(jsonSchema).toMatchObject({
      type: "object",
      required: ["fields"],
      properties: { fields: { type: "array" }, reports: { type: "array" } },
    });
  });

  it("returns paths for invalid configs and unknown kinds", () => {
    const schema = {
      fields: [
        { kind: "number", label: "Count", min: "wrong" },
        { kind: "tenant-field", label: "Tenant" },
      ],
    };
    const result = validateSchema(schema, registry);

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: ["fields", 0, "min"], code: "invalid-config" }),
        expect.objectContaining({ path: ["fields", 1, "kind"], code: "unknown-kind" }),
      ]),
    );
    expect(findUnknownKinds(schema, registry)).toEqual([
      expect.objectContaining({ section: "fields", index: 1, kind: "tenant-field" }),
    ]);
  });

  it("rejects malformed top-level schema values", () => {
    expect(validateSchema(null, registry)).toMatchObject({
      success: false,
      issues: [{ path: [], code: "invalid-schema" }],
    });
    expect(validateSchema({ fields: "wrong" }, registry)).toMatchObject({
      success: false,
      issues: [{ path: ["fields"], code: "invalid-schema" }],
    });
  });

  it("reports nested and normalization errors at their exact paths", () => {
    const nested = validateSchema(
      {
        fields: [
          {
            kind: "series",
            label: "History",
            field1: { kind: "tenant-field", label: "When" },
            field2: { kind: "number", label: "Value" },
          },
        ],
      },
      registry,
    );
    expect(nested).toMatchObject({
      success: false,
      issues: [{ path: ["fields", 0, "field1", "kind"], code: "unknown-kind" }],
    });

    const duplicate = validateSchema(
      {
        fields: [
          { id: "same", kind: "text", label: "A" },
          { id: "same", kind: "text", label: "B" },
        ],
      },
      registry,
    );
    expect(duplicate).toMatchObject({
      success: false,
      issues: [{ path: ["fields", 1, "id"], code: "invalid-config" }],
    });
  });

  it("includes custom registry definitions in JSON Schema", () => {
    const customRegistry = createRegistry().registerField({
      kind: "tenant-field",
      schema: z.object({
        kind: z.literal("tenant-field"),
        label: z.string(),
        tenantOption: z.string().min(1),
      }),
    });

    expect(JSON.stringify(toSchemaJsonSchema(customRegistry))).toContain("tenantOption");
    expect(
      validateSchema(
        {
          fields: [{ kind: "tenant-field", label: "Tenant", tenantOption: "active" }],
        },
        customRegistry,
      ).success,
    ).toBe(true);
  });

  it("resolves every local reference from the generated document root", () => {
    const jsonSchema = toSchemaJsonSchema(registry);

    expect(JSON.stringify(jsonSchema)).toContain('"$ref"');
    expect(unresolvedLocalRefs(jsonSchema)).toEqual([]);
  });

  it("keeps recursive plugin schemas self-contained", () => {
    type RecursiveField = {
      kind: "recursive-field";
      label: string;
      children?: RecursiveField[];
    };
    const recursiveFieldSchema: z.ZodType<RecursiveField> = z.lazy(() =>
      z.strictObject({
        kind: z.literal("recursive-field"),
        label: z.string(),
        children: z.array(recursiveFieldSchema).optional(),
      }),
    );
    type NestedField = {
      kind: "nested-field";
      label: string;
      child?: NestedField;
    };
    const nestedFieldSchema: z.ZodType<NestedField> = z.lazy(() =>
      z.strictObject({
        kind: z.literal("nested-field"),
        label: z.string(),
        child: nestedFieldSchema.optional(),
      }),
    );
    const customRegistry = createRegistry()
      .registerField({
        kind: "recursive-field",
        schema: recursiveFieldSchema,
      })
      .registerField({
        kind: "nested-field",
        schema: nestedFieldSchema,
      });
    const jsonSchema = toSchemaJsonSchema(customRegistry);
    const validator = z.fromJSONSchema(jsonSchema);

    expect(unresolvedLocalRefs(jsonSchema)).toEqual([]);
    expect(jsonSchema).toMatchObject({
      properties: { fields: { items: { oneOf: expect.any(Array) } } },
    });
    expect(
      validator.safeParse({
        fields: [
          {
            kind: "recursive-field",
            label: "Root",
            children: [{ kind: "recursive-field", label: "Child" }],
          },
          { kind: "nested-field", label: "Root", child: { kind: "nested-field", label: "Leaf" } },
        ],
      }).success,
    ).toBe(true);
    expect(validator.safeParse({ fields: [{ kind: "unknown", label: "Wrong" }] }).success).toBe(
      false,
    );
  });

  it("preserves empty registry and root object constraints", () => {
    const validator = z.fromJSONSchema(toSchemaJsonSchema(createRegistry()));

    expect(validator.safeParse({ fields: [] }).success).toBe(true);
    expect(validator.safeParse({ fields: [{}] }).success).toBe(false);
    expect(validator.safeParse({ fields: [], reports: [{}] }).success).toBe(false);
    expect(validator.safeParse({ fields: [], extra: true }).success).toBe(false);
  });

  it("rejects duplicate schema metadata ids", () => {
    const duplicateIdRegistry = createRegistry()
      .registerField({
        kind: "first",
        schema: z.object({ kind: z.literal("first"), label: z.string() }).meta({ id: "duplicate" }),
      })
      .registerField({
        kind: "second",
        schema: z
          .object({ kind: z.literal("second"), label: z.string() })
          .meta({ id: "duplicate" }),
      });

    expect(() => toSchemaJsonSchema(duplicateIdRegistry)).toThrow(
      'Duplicate schema id "duplicate" detected during JSON Schema conversion.',
    );
  });
});
