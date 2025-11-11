// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { beforeEach, describe, expect, it } from "vitest";
import { z } from "zod";
import type { DescriptorItem } from "@/core/app";
import { FieldStrategy } from "@/extensions/app";
import { MLForm } from "@/mlform";

class CustomFieldStrategy extends FieldStrategy {
  constructor(type: string = "custom-field") {
    super(
      type,
      z.object({
        type: z.literal(type),
        title: z.string(),
        value: z.optional(z.unknown()),
      }),
      () => Promise.resolve(undefined)
    );
  }

  protected buildControl(): { tag: string; props: Record<string, unknown> } {
    return { tag: "custom-input", props: { placeholder: "Enter value" } };
  }

  buildDescriptor(payload: unknown): DescriptorItem {
    return super.buildDescriptor(payload);
  }
}

describe("MLForm State Management Suite", () => {
  let form: MLForm;

  beforeEach(() => {
    form = new MLForm("http://localhost:3000");
  });

  describe("Last Inputs and Response Tracking", () => {
    it("should initialize with null lastInputs", () => {
      expect(form.lastInputs).toBeNull();
    });

    it("should initialize with null lastResponse", () => {
      expect(form.lastResponse).toBeNull();
    });

    it("should maintain lastInputs reference after setting", () => {
      const inputs = { field1: "value1", field2: 42 };
      form["_lastInputs"] = inputs;
      expect(form.lastInputs).toBe(inputs);
    });

    it("should return stored value for lastResponse", () => {
      expect(form.lastResponse).toBeNull();
      expect(typeof form.lastResponse).toBe("object");
    });
  });

  describe("Event Listener Management", () => {
    it("should have empty listener set initially", () => {
      expect(form["_listeners"].size).toBe(0);
    });

    it("should register submit callback listener", () => {
      const callback = () => {
        "";
      };
      form.onSubmit(callback);
      expect(form["_listeners"].size).toBe(1);
    });

    it("should return unsubscribe function", () => {
      const callback = () => {
        "";
      };
      const unsubscribe = form.onSubmit(callback);
      expect(typeof unsubscribe).toBe("function");
    });

    it("should unsubscribe callback when calling returned function", () => {
      const callback = () => {
        "";
      };
      const unsubscribe = form.onSubmit(callback);
      expect(form["_listeners"].size).toBe(1);
      unsubscribe();
      expect(form["_listeners"].size).toBe(0);
    });

    it("should register multiple listeners", () => {
      const cb1 = () => {
        "";
      };
      const cb2 = () => {
        "";
      };
      const cb3 = () => {
        "";
      };
      form.onSubmit(cb1);
      form.onSubmit(cb2);
      form.onSubmit(cb3);
      expect(form["_listeners"].size).toBe(3);
    });

    it("should only unsubscribe target listener", () => {
      const cb1 = () => {
        "";
      };
      const cb2 = () => {
        "";
      };
      const unsub1 = form.onSubmit(cb1);
      form.onSubmit(cb2);
      unsub1();
      expect(form["_listeners"].size).toBe(1);
    });
  });

  describe("Listener Invocation", () => {
    it("should track listener count during operations", () => {
      const callback1 = () => {
        "";
      };
      const callback2 = () => {
        "";
      };

      form.onSubmit(callback1);
      expect(form["_listeners"].size).toBe(1);

      form.onSubmit(callback2);
      expect(form["_listeners"].size).toBe(2);
    });

    it("should handle listener count after unsubscribe", () => {
      const callback = () => {
        "";
      };
      const unsub = form.onSubmit(callback);
      expect(form["_listeners"].size).toBe(1);

      unsub();
      expect(form["_listeners"].size).toBe(0);
    });

    it("should have listeners as Set instance", () => {
      expect(form["_listeners"] instanceof Set).toBe(true);
    });

    it("should allow multiple unsubscriptions without error", () => {
      const unsub1 = form.onSubmit(() => {
        "";
      });
      const unsub2 = form.onSubmit(() => {
        "";
      });

      expect(() => {
        unsub1();
        unsub2();
      }).not.toThrow();
    });
  });

  describe("Backend URL Management", () => {
    it("should store backend URL from constructor", () => {
      const backendUrl = "http://api.example.com:8000";
      const customForm = new MLForm(backendUrl);
      expect(customForm["backendUrl"]).toBe(backendUrl);
    });

    it("should handle various backend URL formats", () => {
      const urls = [
        "http://localhost:3000",
        "https://api.example.com",
        "http://192.168.1.1:8080",
        "",
      ];

      urls.forEach((url) => {
        const customForm = new MLForm(url);
        expect(customForm["backendUrl"]).toBe(url);
      });
    });
  });

  describe("Service Initialization", () => {
    it("should create field service without backend URL", () => {
      expect(form["fieldService"]).toBeDefined();
    });

    it("should create model service with backend URL", () => {
      expect(form["modelService"]).toBeDefined();
    });

    it("should maintain separate field and model services", () => {
      const fieldService = form["fieldService"];
      const modelService = form["modelService"];
      expect(fieldService).not.toBe(modelService);
    });

    it("should have independent registries", () => {
      const fieldRegistry = form["fieldService"].reg;
      const modelRegistry = form["modelService"].reg;
      expect(fieldRegistry).not.toBe(modelRegistry);
    });

    it("should have independent schemas", () => {
      const fieldStrategy = new CustomFieldStrategy("field-type");
      form.register(fieldStrategy);
      expect(form["fieldService"].reg.get("field-type")).toBeDefined();
      expect(form["modelService"].reg.get("field-type")).toBeUndefined();
    });

    it("should initialize listeners as empty set", () => {
      expect(form["_listeners"] instanceof Set).toBe(true);
      expect(form["_listeners"].size).toBe(0);
    });
  });

  describe("Form Instance Independence", () => {
    it("should create independent form instances", () => {
      const form1 = new MLForm("http://localhost:3000");
      const form2 = new MLForm("http://localhost:3001");

      expect(form1["backendUrl"]).not.toBe(form2["backendUrl"]);
      expect(form1["fieldService"]).not.toBe(form2["fieldService"]);
    });

    it("should not share listeners between instances", () => {
      const form1 = new MLForm("http://localhost:3000");
      const form2 = new MLForm("http://localhost:3001");

      form1.onSubmit(() => {
        "";
      });
      expect(form1["_listeners"].size).toBe(1);
      expect(form2["_listeners"].size).toBe(0);
    });

    it("should not share registries between instances", () => {
      const form1 = new MLForm("http://localhost:3000");
      const form2 = new MLForm("http://localhost:3001");

      const strategy1 = new CustomFieldStrategy("form1-strategy");
      form1.register(strategy1);

      expect(form1["fieldService"].reg.get("form1-strategy")).toBeDefined();
      expect(form2["fieldService"].reg.get("form1-strategy")).toBeUndefined();
    });
  });
});
