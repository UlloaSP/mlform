"""Export the supplied numeric CatBoost bundle for browser inference.

Run with ../../mlbundle/.venv/Scripts/python.exe scripts/export-bp-model.py.
CatBoost is used only to generate independent reference predictions.
"""

import hashlib
import json
from pathlib import Path
import zipfile

import numpy as np
from catboost import CatBoostClassifier

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT.parent.parent / "models/new-ones/mlbundles_0.1.0a2"
bundle = SOURCE / "best_BP_Minimal.mlbundle"
destination = ROOT / "public/models"
destination.mkdir(parents=True, exist_ok=True)

with zipfile.ZipFile(bundle) as archive:
    manifest = json.loads(archive.read("manifest.json"))
    native = json.loads(archive.read("structure.json"))["native_model"]
    model_bytes = archive.read("model.cbm")

assert native["approx_dimension"] == 1
assert manifest["model"]["pipeline"]["transformers"] is None
assert len(manifest["features"]["names"]) == 16
assert sum(2**depth for depth in native["tree_depths"]) == len(native["leaf_values"])
assert sum(native["tree_depths"]) == len(native["tree_splits"])

metadata = {
    "source": "best_BP_Minimal.mlbundle",
    "bundleId": manifest["bundle_id"],
    "bundleSha256": hashlib.sha256(bundle.read_bytes()).hexdigest(),
    "featureOrder": manifest["features"]["names"],
    "borders": [
        [feature["flat_index"], border]
        for feature in native["float_features"]
        for border in feature["borders"]
    ],
    "depths": native["tree_depths"],
    "splits": native["tree_splits"],
    "scale": native["scale"],
    "bias": native["bias"][0],
    "leafCount": len(native["leaf_values"]),
}
leaves = np.asarray(native["leaf_values"], dtype="<f8").tobytes()
metadata["leavesSha256"] = hashlib.sha256(leaves).hexdigest()
(destination / "best-bp-minimal.json").write_text(json.dumps(metadata, separators=(",", ":")), encoding="utf-8")
(destination / "best-bp-minimal.bin").write_bytes(leaves)
(ROOT / "src/clinical-demos/lab2pressure-schema.json").write_bytes((SOURCE / "best_BP_Minimal.json").read_bytes())

# Native predictions are the oracle for the browser evaluator, including float32 borders.
model = CatBoostClassifier()
model.load_model(blob=model_bytes)
rng = np.random.default_rng(42)
base = np.array([18, 100, 110, 4, 130, 8, 125, 135, 115, 145, 80, 5, 75, 85, 65, 95], dtype=float)
rows = [base, np.zeros(16), base * 0.8, base * 1.5]
rows.extend(base * rng.uniform(0.5, 1.8, (20, 16)))
for feature in native["float_features"]:
    border = feature["borders"][len(feature["borders"]) // 2]
    for value in (np.nextafter(np.float32(border), np.float32(-np.inf)), border, np.nextafter(np.float32(border), np.float32(np.inf))):
        row = base.copy()
        row[feature["flat_index"]] = value
        rows.append(row)
rows = np.asarray(rows)
fixture = {"bundleSha256": metadata["bundleSha256"], "rows": rows.tolist(), "probabilities": model.predict_proba(rows).tolist()}
fixture_dir = ROOT / "tests/fixtures"
fixture_dir.mkdir(parents=True, exist_ok=True)
(fixture_dir / "best-bp-minimal.json").write_text(json.dumps(fixture, separators=(",", ":")), encoding="utf-8")
print(f"Exported {len(native['tree_depths'])} trees, {len(leaves):,} leaf bytes and {len(rows)} native reference predictions.")
