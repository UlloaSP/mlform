// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { describe, expect, it } from "vitest";
import { createMlRegistryPack } from "@/builtins";
import { findUnknownKinds, toSchemaJsonSchema, validateSchema } from "@/schema";

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
});
