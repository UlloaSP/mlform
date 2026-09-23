/// <reference types="node" />

import assert from "node:assert/strict";
import { execFileSync, type ExecFileSyncOptions } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const bundle = join(root, "dist", "mlform", "kit.mjs");
assert.ok(existsSync(bundle), "Run `vp build` before the package consumer test.");

const temporaryDirectory = mkdtempSync(join(tmpdir(), "mlform-consumer-"));
const npmCli = join(dirname(process.execPath), "node_modules", "npm", "bin", "npm-cli.js");
const runNpm = (args: string[], options: ExecFileSyncOptions = {}): string | Buffer =>
  process.platform === "win32"
    ? execFileSync(process.execPath, [npmCli, ...args], options)
    : execFileSync("npm", args, options);

try {
  const packOutput = runNpm(
    ["pack", root, "--pack-destination", temporaryDirectory, "--ignore-scripts", "--json"],
    { encoding: "utf8" },
  ).toString();
  const [packed] = JSON.parse(packOutput) as [{ filename: string; files: Array<{ path: string }> }];
  const packedPaths = new Set(packed.files.map((file) => file.path));
  assert.ok(packedPaths.has("README.md"), "Published package must include its README.");
  assert.ok(packedPaths.has("LICENSE"), "Published package must include its license.");
  assert.ok(packedPaths.has("package.json"), "Published package must include its manifest.");
  const { filename } = packed;
  const archive = join(temporaryDirectory, filename);

  writeFileSync(
    join(temporaryDirectory, "package.json"),
    JSON.stringify({ private: true, type: "module" }),
  );
  runNpm(["install", "--ignore-scripts", "--no-audit", "--no-fund", "--no-package-lock", archive], {
    cwd: temporaryDirectory,
    stdio: "inherit",
  });

  const installedManifest = JSON.parse(
    readFileSync(join(temporaryDirectory, "node_modules", "mlform", "package.json"), "utf8"),
  );
  assert.deepEqual(installedManifest.exports["."], installedManifest.exports["./kit"]);

  writeFileSync(
    join(temporaryDirectory, "consumer.ts"),
    `import { mountForm as mountFormFromRoot } from "mlform";
import {
  mountForm,
  type MountFormOptions,
} from "mlform/kit";
import { createBuiltinDescriptorRegistry, createFormView, defineMLFormPlugin } from "mlform/view";
import { createForm } from "mlform/runtime";
import {
  baseFieldConfigSchema,
  baseReportConfigSchema,
  createRegistry,
  mappedToSchema,
} from "mlform/schema";
import { createBuiltinMlRegistry } from "mlform/builtins";
import { createTransportRequestRunner } from "mlform/transport";
import { mountPrimitiveForm } from "mlform/primitives";
import { createBuiltinDesignSystemRegistry } from "mlform/design";
import * as builtins from "mlform/builtins";
import * as primitives from "mlform/primitives";

type Options = MountFormOptions;
void (null as Options | null);
void [
  createBuiltinDescriptorRegistry,
  createFormView,
  defineMLFormPlugin,
  mountForm,
  mountFormFromRoot,
  createForm,
  baseFieldConfigSchema,
  baseReportConfigSchema,
  mappedToSchema,
  createRegistry,
  createBuiltinMlRegistry,
];
void [createTransportRequestRunner, mountPrimitiveForm, createBuiltinDesignSystemRegistry];
// @ts-expect-error removed before publication; no compatibility alias remains
builtins.createMlRegistryPack;
// @ts-expect-error use mountPrimitiveForm instead
primitives.mountForm;
// @ts-expect-error use unmountPrimitiveForm instead
primitives.unmountForm;
`,
  );
  writeFileSync(
    join(temporaryDirectory, "tsconfig.json"),
    JSON.stringify({
      compilerOptions: {
        lib: ["ES2022", "DOM"],
        module: "ESNext",
        moduleResolution: "Bundler",
        noEmit: true,
        strict: true,
        target: "ES2022",
      },
      files: ["consumer.ts"],
    }),
  );
  execFileSync(
    process.execPath,
    [join(root, "node_modules", "typescript", "bin", "tsc"), "-p", "tsconfig.json"],
    { cwd: temporaryDirectory, stdio: "inherit" },
  );

  writeFileSync(
    join(temporaryDirectory, "consumer.mjs"),
    `import assert from "node:assert/strict";
import { mountForm as mountFormFromRoot } from "mlform";
import { mountForm as mountFormFromKit } from "mlform/kit";
import { createFormView } from "mlform/view";
import { createBuiltinMlRegistry } from "mlform/builtins";
import { createForm } from "mlform/runtime";
import {
  baseFieldConfigSchema,
  baseReportConfigSchema,
  createRegistry,
  mappedToSchema,
} from "mlform/schema";
import { extractErrorMessage } from "mlform/transport";

assert.equal(createBuiltinMlRegistry().getField("text")?.kind, "text");
assert.equal(mountFormFromRoot, mountFormFromKit);
assert.equal(typeof createFormView, "function");
assert.equal(createRegistry().listFields().length, 0);
assert.equal(baseFieldConfigSchema.safeParse({ kind: "custom", label: "Custom" }).success, true);
assert.equal(baseReportConfigSchema.safeParse({ kind: "custom" }).success, true);
assert.equal(mappedToSchema.safeParse({ primary: "prediction", optional: null }).success, true);
assert.equal(typeof createForm, "function");
assert.equal(extractErrorMessage(new Error("expected")), "expected");
`,
  );
  execFileSync(process.execPath, ["consumer.mjs"], {
    cwd: temporaryDirectory,
    stdio: "inherit",
  });
  console.log("Packed package consumer passed for the root facade and all eight layer roots.");
} finally {
  rmSync(temporaryDirectory, { force: true, recursive: true });
}
