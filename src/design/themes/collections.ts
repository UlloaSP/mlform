// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { ThemeManifest } from "../types";
import { airbnbTheme } from "./airbnb";
import { clickHouseTheme } from "./clickhouse";
import { cobaltTheme } from "./cobalt";
import { graphiteTheme } from "./graphite";
import { neutralTheme } from "./neutral";
import { sageTheme } from "./sage";
import { sunsetTheme } from "./sunset";

export const builtinThemes: ThemeManifest[] = [
  clickHouseTheme,
  airbnbTheme,
  neutralTheme,
  cobaltTheme,
  sageTheme,
  sunsetTheme,
  graphiteTheme,
];
