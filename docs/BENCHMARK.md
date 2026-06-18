# Benchmark Notes

Last reviewed: 2026-06-19

OpenHWP Studio should not try to beat every HWP/HWPX project by cloning the same engine surface. The winning position is a local-first browser workbench that combines viewing, safe HWPX editing, package inspection, validation, repair reporting, and export evidence in one UI.

## Reference Projects

| Project | Strongest area | What OpenHWP Studio should learn | How OpenHWP Studio can win |
| --- | --- | --- | --- |
| [rhwp](https://github.com/edwardkim/rhwp) | Rust/WASM HWP/HWPX viewer and editor engine | Accurate browser rendering, HWP/HWPX conversion, extension-style distribution | Build a product workflow on top: package doctor, change tracking, report evidence, public samples |
| [HOP](https://github.com/golbin/hop) | Desktop shell around rhwp | OS file association, print, PDF export, multi-window desktop workflow | Stay install-free in the browser while preparing PWA/offline packaging |
| [kordoc](https://github.com/chrisryugj/kordoc) | Korean public-sector parsing, diffing, generation, broad format automation | Batch automation, form workflows, document diff mindset | Bring those safety/report ideas into a visible browser UI for non-developers |
| [python-hwpx](https://github.com/airmang/python-hwpx) | Pure Python HWPX read/edit/generate/validate workflows | HWPX package validation and repair-oriented APIs | Make validation immediately visible through health score, issue list, and Report JSON |
| [unhwp](https://github.com/iyulab/unhwp) | Fast HWP/HWPX extraction to Markdown/text/JSON with bindings | CLI/library extraction speed and structured exports | Keep table-aware browser exports and add a future CLI that reuses the same contracts |
| [handoc](https://github.com/muin-company/handoc) | Real-document coverage, HWPX writer, round-trip preservation claims | Corpus-driven confidence and broad rich-content extraction | Grow public fixtures and CI gates before claiming broad compatibility |

## Current Differentiators

- Browser-first HWPX package doctor with health score, issue counts, media reference risk, unsupported control warnings, and repair-plan data.
- Browser HWPX package explorer for ZIP entries, manifest targets, missing target detection, media references, and doctor issues.
- Source-preserving HWPX export that clones the original package and verifies paragraph/table-cell text round-trips.
- Report JSON schema v2 with package doctor, compatibility snapshot, change diff, latest export verification, and package entry preservation.
- Public synthetic HWPX fixture with CI checks for ZIP entries, section text extraction, table detection, package doctor expectations, and patch round-trip.
- Table-aware TXT, Markdown, HTML, and JSON exports from the same editor block model.

## Next Moves To Beat The Field

1. Add fixture suite coverage for multi-section documents, media/BinData, broken relationships, malformed XML, headers/footers, footnotes, and merged tables.
2. Turn package doctor repair-plan entries into previewable one-click repairs for safe metadata fixes.
3. Expand the package explorer into a relationship graph with media thumbnails and before/after repair previews.
4. Promote HWP binary ingest from preview-only to a guided HWP -> editable HWPX workflow through `@rhwp/core`.
5. Add a CLI/PWA offline path so developers and institutions can run the same validation/export contracts outside the demo page.
