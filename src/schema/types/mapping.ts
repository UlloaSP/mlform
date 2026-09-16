// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

export type MappedToTarget = string | number;
export type MappedTo = MappedToTarget | Record<string, MappedToTarget | null | undefined>;
export type MappedToRoute = { backend: string; mappedTo: MappedToTarget };
