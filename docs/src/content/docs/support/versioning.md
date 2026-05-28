---
title: Versioning
description: How the documentation tracks MLForm versions.
---

The current release line in this repository is `0.1.12`.

The published documentation tracks the latest maintained code on the `main` branch unless a release note says otherwise. In practice, that means the docs are expected to describe the current npm release after each tagged publication, and may briefly move ahead of npm between merges and the next release cut.

For `0.1.4`, the intent is:

- the README examples match the shipped public API
- getting started pages use `mountForm`, `fields`, `reports`, `kind`, and `label`
- installation guidance reflects the active Vite+ contributor workflow in this repository
- migration guidance keeps legacy API names out of the main path and in dedicated migration pages only

Compatibility notes:

- current examples use `mountForm`, `fields`, `reports`, `kind`, and `label`
- legacy API names are documented only in the migration guide
- no URL redirects are kept for the old documentation structure
- advanced reference pages are curated manually; TypeDoc is not part of this documentation build yet

For package version details, check:

- npm: `mlform`
- GitHub releases: `UlloaSP/mlform`
