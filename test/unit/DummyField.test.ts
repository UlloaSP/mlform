import { describe, expect, it } from "vitest";
import { DummyField } from "../_fixtures/DummyField";

describe("DummyField", () => {
  it("should create an instance", () => {
    const field = new DummyField();
    expect(field).toBeInstanceOf(DummyField);
  });

  it("should have correct type", () => {
    const field = new DummyField("test-type");
    expect(field.type).toBe("test-type");
  });

  it("should have default type when not specified", () => {
    const field = new DummyField();
    expect(field.type).toBe("dummy");
  });

  it("should build descriptor correctly", () => {
    const field = new DummyField();
    const payload = { test: "value", number: 42 };
    const descriptor = field.buildDescriptor(payload);

    expect(descriptor).toEqual({
      tag: "dummy-component",
      props: payload,
      slot: "inputs",
    });
  });

  it("should have schema property", () => {
    const field = new DummyField();
    expect(field.schema).toBeDefined();
    expect(field.schema.parse("test")).toBe("test");
  });
});

// Test básico para verificar que el entorno está funcionando
describe("Environment", () => {
  it("should have DOM available", () => {
    const div = document.createElement("div");
    div.textContent = "Hello World";
    expect(div.textContent).toBe("Hello World");
  });

  it("should handle basic zod validation", () => {
    const field = new DummyField();
    expect(() => field.schema.parse(123)).toThrow();
    expect(field.schema.parse("valid string")).toBe("valid string");
  });
});
