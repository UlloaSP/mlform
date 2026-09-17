/// <reference types="node" />

import { describe, expect, it } from "vitest";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import ts from "@typescript/typescript6";
import type { BuiltinFieldDefinition, SeriesPoint } from "@/builtins";
import type { ComponentKey, ThemeManifest } from "@/design";
import type { DefinedReportKind } from "@/kit";
import type { PrimitiveReportRequest, ReportDescriptor } from "@/primitives";
import type { FieldController } from "@/runtime";
import type { FormSchema, ReportConfig } from "@/schema";
import type { SubmitRequest, Transport } from "@/transport";

const moduleNames = new Set([
  "builtins",
  "design",
  "kit",
  "primitives",
  "runtime",
  "schema",
  "transport",
]);

const allowedDependencies = new Map<string, ReadonlySet<string>>([
  ["schema", new Set()],
  ["design", new Set()],
  ["primitives", new Set(["transport"])],
  ["transport", new Set(["schema"])],
  ["runtime", new Set(["schema", "transport"])],
  ["builtins", new Set(["schema", "runtime"])],
  ["kit", new Set(["schema", "runtime", "builtins", "primitives", "design"])],
]);

const sourceRoot = resolve(process.cwd(), "src");

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

const collectModuleSpecifiers = (filePath: string, source: string): string[] => {
  const sourceFile = ts.createSourceFile(
    filePath,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const specifiers: string[] = [];

  const visit = (node: ts.Node): void => {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      specifiers.push(node.moduleSpecifier.text);
    } else if (
      ts.isImportTypeNode(node) &&
      ts.isLiteralTypeNode(node.argument) &&
      ts.isStringLiteral(node.argument.literal)
    ) {
      specifiers.push(node.argument.literal.text);
    } else if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      ts.isStringLiteral(node.arguments[0])
    ) {
      specifiers.push(node.arguments[0].text);
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  return specifiers;
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
  it("keeps the package root as a direct alias of the kit module", () => {
    const packageJson = JSON.parse(
      readFileSync(resolve(process.cwd(), "package.json"), "utf8"),
    ) as {
      exports: Record<string, { types?: string; import?: string }>;
    };
    const exportPaths = Object.keys(packageJson.exports);
    const typePaths = Object.values(packageJson.exports).map((entry) => entry.types);

    expect(packageJson.exports["."]).toEqual(packageJson.exports["./kit"]);
    expect(
      exportPaths.filter((path) => path !== ".").every((path) => /^\.\/[^/]+$/.test(path)),
    ).toBe(true);
    expect(typePaths).toContain("./dist/types/kit/index.d.ts");
    expect(typePaths.filter(Boolean).every((path) => path?.startsWith("./dist/types/"))).toBe(true);
  });

  it("exposes declarative kind types from the kit module source API", () => {
    const kind = null as DefinedReportKind<ReportConfig, unknown> | null;

    expect(kind).toBeNull();
  });

  it("exposes public types from every existing module root source API", () => {
    type RootTypes = [
      BuiltinFieldDefinition,
      SeriesPoint,
      ComponentKey,
      ThemeManifest,
      DefinedReportKind<ReportConfig, unknown>,
      PrimitiveReportRequest,
      ReportDescriptor,
      FieldController,
      FormSchema,
      SubmitRequest,
      Transport,
    ];

    const roots = null as RootTypes | null;

    expect(roots).toBeNull();
  });

  it("does not use module subpath aliases", () => {
    const violations: string[] = [];

    for (const filePath of listTypeScriptFiles(sourceRoot)) {
      const source = readFileSync(filePath, "utf8");
      for (const specifier of collectModuleSpecifiers(filePath, source)) {
        if (!specifier.startsWith("@/")) continue;

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
      for (const specifier of collectModuleSpecifiers(filePath, source)) {
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

  it("keeps cross-module dependencies inside the allowed DAG", () => {
    const violations: string[] = [];

    for (const filePath of listTypeScriptFiles(sourceRoot)) {
      const sourceModule = moduleNameForPath(filePath);
      if (!sourceModule) continue;

      const source = readFileSync(filePath, "utf8");
      for (const specifier of collectModuleSpecifiers(filePath, source)) {
        const resolved = resolveSourceSpec(filePath, specifier);
        const targetModule = resolved ? moduleNameForPath(resolved) : null;
        if (!targetModule || targetModule === sourceModule) continue;

        if (!allowedDependencies.get(sourceModule)?.has(targetModule)) {
          const relativeFile = relative(process.cwd(), filePath).replaceAll("\\", "/");
          violations.push(`${relativeFile}: ${sourceModule} -> ${targetModule}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it("has no internal import cycles", () => {
    const files = listTypeScriptFiles(sourceRoot);
    const fileSet = new Set(files);
    const edges = new Map<string, string[]>();

    for (const filePath of files) {
      const source = readFileSync(filePath, "utf8");
      const dependencies: string[] = [];
      for (const specifier of collectModuleSpecifiers(filePath, source)) {
        const resolved = resolveSourceSpec(filePath, specifier);
        if (resolved && fileSet.has(resolved)) dependencies.push(resolved);
      }
      edges.set(filePath, dependencies);
    }

    const visited = new Set<string>();
    const visiting = new Set<string>();
    const path: string[] = [];
    const cycles: string[] = [];

    const visit = (filePath: string): void => {
      if (visiting.has(filePath)) {
        const cycleStart = path.indexOf(filePath);
        const cycle = [...path.slice(cycleStart), filePath]
          .map((entry) => relative(sourceRoot, entry).replaceAll("\\", "/"))
          .join(" -> ");
        if (!cycles.includes(cycle)) cycles.push(cycle);
        return;
      }
      if (visited.has(filePath)) return;

      visiting.add(filePath);
      path.push(filePath);
      for (const dependency of edges.get(filePath) ?? []) visit(dependency);
      path.pop();
      visiting.delete(filePath);
      visited.add(filePath);
    };

    for (const filePath of files) visit(filePath);
    expect(cycles).toEqual([]);
  });
});
