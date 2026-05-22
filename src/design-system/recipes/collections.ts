// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { RecipeManifest } from "../types";
import { contrastRecipe } from "./contrast";
import { defaultRecipe } from "./default";
import { minimalRecipe } from "./minimal";
import { softRecipe } from "./soft";

export const builtinRecipes: RecipeManifest[] = [
  defaultRecipe,
  minimalRecipe,
  softRecipe,
  contrastRecipe,
];
