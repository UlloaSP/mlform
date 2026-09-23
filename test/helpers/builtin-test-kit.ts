import { createBuiltinMlRegistry } from "@/builtins";
import { createBuiltinDescriptorRegistry } from "@/view";
import type { DefinedFieldKind, DefinedReportKind } from "@/view";
import type { PrimitiveDescriptorRegistry } from "@/primitives";
import type { FieldConfig, Registry, ReportConfig } from "@/schema";

export const createBuiltinTestKit = () => ({
  registry: createBuiltinMlRegistry(),
  descriptorRegistry: createBuiltinDescriptorRegistry(),
  behaviors: [],
});

export const registerDefinedFieldKind = <TConfig extends FieldConfig, TValue>(
  registry: Registry,
  descriptorRegistry: PrimitiveDescriptorRegistry,
  kind: DefinedFieldKind<TConfig, TValue>,
): void => kind.register(registry, descriptorRegistry);

export const registerDefinedReportKind = <TConfig extends ReportConfig>(
  registry: Registry,
  descriptorRegistry: PrimitiveDescriptorRegistry,
  kind: DefinedReportKind<TConfig, unknown>,
): void => kind.register(registry, descriptorRegistry);
