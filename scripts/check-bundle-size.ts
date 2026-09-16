/// <reference types="node" />

import { gzipSync } from "node:zlib";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

interface PackageManifest {
  exports: Record<string, { import: string }>;
}

interface BundleResult {
  surface: string;
  entry: string;
  files: number;
  rawBytes: number;
  gzipBytes: number;
  budgetBytes: number;
}

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const packageJson = JSON.parse(readFileSync(join(root, "package.json"), "utf8")) as PackageManifest;
const budgets: Record<string, number> = {
  ".": 75,
  "./kit": 75,
  "./primitives": 28,
  "./design": 15,
  "./runtime": 18,
  "./builtins": 9,
  "./schema": 5,
  "./transport": 2,
};

const localImports = (source: string): string[] => {
  const specifiers: string[] = [];
  const patterns = [
    /(?:^|[;\n])\s*(?:import|export)(?:[^"'`]*?\bfrom)?\s*["']([^"']+)["']/gm,
    /\bimport\(\s*["']([^"']+)["']\s*\)/g,
  ];
  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) {
      if (match[1].startsWith(".")) specifiers.push(match[1]);
    }
  }
  return specifiers;
};

const reachableFiles = (entry: string): string[] => {
  const files = new Set<string>();
  const visit = (file: string): void => {
    if (files.has(file)) return;
    files.add(file);
    const source = readFileSync(file, "utf8");
    for (const specifier of localImports(source)) visit(resolve(dirname(file), specifier));
  };
  visit(entry);
  return [...files].sort((left, right) => left.localeCompare(right));
};

const results: BundleResult[] = [];
const failures: string[] = [];
for (const [surface, config] of Object.entries(packageJson.exports)) {
  const budgetKiB = budgets[surface];
  if (budgetKiB === undefined) {
    failures.push(`${surface}: missing bundle budget`);
    continue;
  }

  const entry = resolve(root, config.import);
  const files = reachableFiles(entry);
  const content = Buffer.concat(files.map((file) => readFileSync(file)));
  const gzipBytes = gzipSync(content).length;
  const budgetBytes = budgetKiB * 1024;
  results.push({
    surface: surface === "." ? "mlform" : `mlform${surface.slice(1)}`,
    entry: relative(root, entry).replaceAll("\\", "/"),
    files: files.length,
    rawBytes: content.length,
    gzipBytes,
    budgetBytes,
  });
  if (gzipBytes > budgetBytes) {
    failures.push(`${surface}: ${(gzipBytes / 1024).toFixed(1)} KiB > ${budgetKiB} KiB`);
  }
}

const statsDirectory = join(root, "stats");
mkdirSync(statsDirectory, { recursive: true });
writeFileSync(join(statsDirectory, "bundle-sizes.json"), `${JSON.stringify(results, null, 2)}\n`);

for (const result of results) {
  console.log(
    `${result.surface.padEnd(19)} ${(result.gzipBytes / 1024).toFixed(1).padStart(6)} KiB gzip / ${(result.budgetBytes / 1024).toFixed(0)} KiB budget`,
  );
}

if (failures.length > 0) {
  throw new Error(`Bundle budget failed:\n${failures.join("\n")}`);
}
