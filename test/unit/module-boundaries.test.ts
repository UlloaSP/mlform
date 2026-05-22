/// <reference types="node" />

import { describe, expect, it } from "vitest";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const moduleNames = new Set([
  "builtins",
  "design",
  "kit",
  "primitives",
  "runtime",
  "schema",
  "transport",
]);

const sourceRoot = resolve(process.cwd(), "src");

const importPattern =
  /^(?:import|export)\s+(?:type\s+)?(?:[\s\S]*?)\s+from\s+["']([^"']+)["']|^import\s+["']([^"']+)["']/gm;

const listTypeScriptFiles = (directory: string): string[] => {
  const files: string[] = [];
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      files.push(...listTypeScriptFiles(path));
    } else if (entry.endsWith(".ts") && !entry.endsWith(".d.ts")) {
      files.push(path);
    }
  }
  return files;
};

const resolveSourceSpec = (filePath: string, specifier: string): string | null => {
  let base: string;
  if (specifier.startsWith("@/")) {
    base = join(sourceRoot, specifier.slice(2));
  } else if (specifier.startsWith(".")) {
    base = resolve(filePath, "..", specifier);
  } else {
    return null;
  }

  const candidates = base.endsWith(".ts") ? [base] : [`${base}.ts`, join(base, "index.ts")];
  return candidates.find((candidate) => existsSync(candidate)) ?? null;
};

const moduleNameForPath = (filePath: string): string | null => {
  const [name] = relative(sourceRoot, filePath).replaceAll("\\", "/").split("/");
  return moduleNames.has(name) ? name : null;
};

describe("module boundaries", () => {
  it("does not use module subpath aliases", () => {
    const violations: string[] = [];

    for (const filePath of listTypeScriptFiles(sourceRoot)) {
      const source = readFileSync(filePath, "utf8");
      for (const match of source.matchAll(importPattern)) {
        const specifier = match[1] ?? match[2];
        if (!specifier?.startsWith("@/")) continue;

        const [moduleName, ...rest] = specifier.slice(2).split("/");
        if (moduleNames.has(moduleName) && rest.length > 0) {
          const relativeFile = relative(process.cwd(), filePath).replaceAll("\\", "/");
          violations.push(`${relativeFile}: ${specifier} -> expected @/${moduleName}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it("uses only root index APIs for cross-module imports and exports", () => {
    const violations: string[] = [];

    for (const filePath of listTypeScriptFiles(sourceRoot)) {
      const sourceModule = moduleNameForPath(filePath);
      if (!sourceModule) continue;

      const source = readFileSync(filePath, "utf8");
      for (const match of source.matchAll(importPattern)) {
        const specifier = match[1] ?? match[2];
        if (!specifier) continue;

        const resolved = resolveSourceSpec(filePath, specifier);
        if (!resolved) continue;

        const targetModule = moduleNameForPath(resolved);
        if (!targetModule || targetModule === sourceModule) continue;

        const expected = `@/${targetModule}`;
        if (specifier !== expected) {
          const relativeFile = relative(process.cwd(), filePath).replaceAll("\\", "/");
          violations.push(`${relativeFile}: ${specifier} -> expected ${expected}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
