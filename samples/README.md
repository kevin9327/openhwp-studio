# Public Samples

This directory contains synthetic HWPX fixtures that are safe to commit and use in public CI.

## Files

- `openhwp-basic.hwpx`: a small generated HWPX-style ZIP package with one section, six text nodes, a style file, relationship metadata, and one table.
- `openhwp-basic.expected.json`: expected package entries, section paths, table count, package doctor score/issues, package explorer counts, repair modes, and extracted text for regression checks.
- `openhwp-media.hwpx`: a generated multi-section package with one referenced `BinData/preview.svg` media asset and an image control marker for preservation checks.
- `openhwp-media.expected.json`: expected multi-section ordering, media entry counts, manifest targets, package doctor warnings, and source-preserving patch behavior.
- `openhwp-broken-rel.hwpx`: a generated package that intentionally omits the root `mimetype` entry and points one manifest item at a missing section file so the package doctor, auto repair export, and repair preview have a public damage case.
- `openhwp-broken-rel.expected.json`: expected warning, missing target count, repair mode counts, auto repair behavior, and round-trip behavior for the diagnostic fixture.

## Regeneration

```powershell
node scripts/create-sample-hwpx.js
node scripts/check-hwpx-fixtures.js
```

Fixtures should be synthetic or explicitly public. Do not commit private office, school, legal, medical, HR, finance, or government documents.
