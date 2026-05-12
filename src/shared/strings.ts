// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

export const slugify = (value: string): string => {
  const normalized = value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "item";
};
