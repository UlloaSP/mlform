// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { m3diseenTheme } from "./m3diseen";
import { dosetailorTheme } from "./dosetailor";
import { eshkraTheme } from "./eshkra";
import type { ThemeManifest } from "../types";
import { airbnbTheme } from "./airbnb";
import { clickHouseTheme } from "./clickhouse";
import { cobaltTheme } from "./cobalt";
import { graphiteTheme } from "./graphite";
import { neutralTheme } from "./neutral";
import { sageTheme } from "./sage";
import { sunsetTheme } from "./sunset";

export const builtinThemes: ThemeManifest[] = [
  eshkraTheme,
  m3diseenTheme,
  dosetailorTheme,
  clickHouseTheme,
  airbnbTheme,
  neutralTheme,
  cobaltTheme,
  sageTheme,
  sunsetTheme,
  graphiteTheme,
];
