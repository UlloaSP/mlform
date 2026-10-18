---
title: Versioning
description: How the documentation tracks MLForm versions.
---

The [published docs](https://docs.mlform.eshkra.dev/) and
[playground](https://playground.mlform.eshkra.dev/) deploy automatically after **CI & Publish**
successfully publishes a new package version to npm from `main`. Both use artifacts built and
verified in that CI run. An unchanged version or failed npm publication does not deploy either site.
Deployment jobs can fail independently; check their results before treating a release as fully deployed.

Documentation in a local checkout can describe unreleased work. Use the installed package version
and its release notes when comparing an application with these docs. Public package surfaces,
examples, runtime behavior, and rendered behavior should describe the same contract at release time.

MLForm is pre-1.0. Review release notes for changes to schemas, validation, serialization, and
rendering before upgrading. Compatibility is an explicit product decision; a new version should
make any changed contract visible rather than keeping an undocumented fallback.

The API reference is curated manually. The docs build checks Astro and TypeScript components,
but does not execute Markdown code examples. Contributors should also verify affected examples
against the public package.

- [npm package and versions](https://www.npmjs.com/package/mlform)
- [GitHub releases](https://github.com/UlloaSP/mlform/releases)
- [Legacy API migration](/migration/from-legacy-mlform/)
