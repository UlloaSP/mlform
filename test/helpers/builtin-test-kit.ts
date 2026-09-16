import { createBuiltinMlRegistry, createMappedCategoryBehavior } from "@/builtins";
import { createBuiltinDescriptorRegistry } from "@/kit";

export const createBuiltinTestKit = () => ({
  registry: createBuiltinMlRegistry(),
  descriptorRegistry: createBuiltinDescriptorRegistry(),
  behaviors: [createMappedCategoryBehavior()],
});
