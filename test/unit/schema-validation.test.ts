// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { describe, expect, it } from "vitest";
import { z } from "zod";
import { createMlRegistryPack } from "@/builtins";
import { createRegistry, findUnknownKinds, toSchemaJsonSchema, validateSchema } from "@/schema";

const registry = createMlRegistryPack().registry;

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
});
