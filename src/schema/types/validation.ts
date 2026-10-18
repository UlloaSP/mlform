// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

export type ValidationMessageResolver = (
  code: string,
  defaultMessage: string,
  args?: readonly unknown[],
) => string;
