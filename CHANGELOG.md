# Changelog

## v0.1.0-alpha.0

First public alpha release.

### Added

- Browser HWPX open/edit/export workflow.
- Source-preserving HWPX export with paragraph and table-cell verification.
- HWPX package inspector, package explorer, package doctor, repair preview, and Report JSON.
- Safe automatic repaired HWPX export for missing root `mimetype`.
- Public synthetic fixtures for basic, media/BinData, and broken-relationship HWPX packages.
- CI checks for static app contracts, HWPX fixtures, and shared export formatter behavior.
- GitHub Pages deployment for the live demo.

### Known Limits

- HWP binary editing is preview/conversion-oriented in the alpha.
- Rich layout fidelity, images/drawings editing, headers, footers, footnotes, comments, forms, track changes, and merged table geometry need more sample-backed work.
- Runtime dependencies are still loaded from CDNs.
