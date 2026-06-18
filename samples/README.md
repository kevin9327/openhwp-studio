# Public Samples

This directory contains synthetic HWPX fixtures that are safe to commit and use in public CI.

## Files

- `openhwp-basic.hwpx`: a small generated HWPX-style ZIP package with one section, six text nodes, a style file, relationship metadata, and one table.
- `openhwp-basic.expected.json`: expected package entries, section paths, table count, and extracted text for regression checks.

## Regeneration

```powershell
node scripts/create-sample-hwpx.js
node scripts/check-hwpx-fixtures.js
```

Fixtures should be synthetic or explicitly public. Do not commit private office, school, legal, medical, HR, finance, or government documents.
