# Technical debt

## Open

- Plugin compatibility and versioning are not formalized. Define a policy when MLForm has external plugin consumers or needs compatibility checks across releases.
- Some cookbook, integration, and migration pages still reference removed transport helpers and policies. Rewrite or remove those pages before treating them as supported examples; the README, docs home, Quick Start, Backend Contract, and First Backend pages describe the current contract.
