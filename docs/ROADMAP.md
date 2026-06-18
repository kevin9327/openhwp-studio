# Roadmap

OpenHWP Studio aims to become the default open-source HWPX workbench for Korean document workflows: local-first, honest about compatibility, useful before it is complete, and built around real files.

## Product Principles

- Local-first by default: documents should not leave the user's browser unless they explicitly export or share them.
- Compatibility is earned: every claim should be tied to a sample document, regression check, or clear limitation.
- HWPX first: prioritize inspectable package structure, repair, diff, and safe editing before promising full HWP binary authoring.
- Public-sector friendly: support workflows common in schools, agencies, courts, companies, and archives.
- Small, reviewable contributions: prefer focused fixes backed by a reproducible file or manual test note.

## Milestones

### 0.1 Alpha: Publishable Workbench

- Local HWPX open/edit/export flow.
- HWP preview path through `@rhwp/core`.
- Basic Markdown, HTML, TXT, JSON, HWPX, and HWP export surfaces.
- Document outline, stats, search/replace, and early Korean quality checks.
- HWPX package inspector for entries, sections, styles, relationships, media, and risky controls.
- Source-preserving HWPX export report with applied, skipped, and verification results.
- HWPX package doctor with health score, issue counts, media reference risk, unsupported control warnings, and repair-plan data.
- Public synthetic HWPX fixture with CI checks for extraction, package doctor expectations, and patch round-trip.
- Existing HWPX table rendering with cell paragraph text round-trip checks.
- Shared TXT/Markdown/HTML/JSON export formatter with table-aware CI contracts.
- Paragraph and source-table cell change tracking included in JSON/Report exports.
- Compatibility matrix, roadmap, launch note, issue templates, PR template, and CI workflow.

### 0.2 Trust the HWPX Core

- Expand public sample HWPX documents with expected extraction/export results.
- Add browser-level export regression checks for paragraph text edits.
- Expand HWPX package inspector into a relationship graph with media preview and manifest detail.
- Replace CDN runtime dependencies with pinned local assets.
- Document supported browser versions with manual test results.
- Turn repair-plan data into one-click repair previews for missing metadata and broken relationship cases.

### 0.3 Diff and Repair Workspace

- Show XML-level and text-level diffs between original and edited HWPX packages.
- Add one-click repair suggestions with before/after preview.
- Preserve more table, image, and style structures during round-trip export.
- Add undo/redo for editor operations.
- Add sample-driven compatibility labels for tables, images, headers, footers, and footnotes.

### 0.4 Automation and Distribution

- Add CLI batch inspection/conversion for schools, agencies, and archives.
- Add PWA install support with pinned offline assets.
- Add GitHub Pages demo with safe public sample files.
- Add browser extension or file-handler integration for faster local workflows.
- Add structured JSON output for downstream automation.

### 0.5 Document Intelligence

- Expand Korean document quality rules for notices, reports, forms, and public announcements.
- Add local-first redaction helpers for sensitive text patterns.
- Add optional AI-assisted cleanup paths that never upload files by default.
- Add accessibility checks for exported HTML/PDF-adjacent workflows.
- Publish a contributor guide for adding compatibility fixtures safely.

## Contribution Tracks

| Track | Good first contribution | Larger contribution |
| --- | --- | --- |
| Compatibility | Report one real sanitized file behavior. | Build a public fixture suite with expected results. |
| HWPX parsing | Improve section/style detection. | Add package inspector and relationship graph. |
| Export safety | Add manual round-trip notes. | Add automated regression checks for edited HWPX packages. |
| Korean quality rules | Add one high-signal writing rule. | Build rule packs for notices, reports, and forms. |
| Browser support | Validate one browser/OS pair. | Maintain browser support matrix and CI smoke tests. |
| Docs/community | Improve issue labels or templates. | Build a release checklist and maintainer playbook. |

## Not Promised Yet

- A complete Hancom Office replacement.
- Perfect HWP binary editing.
- Layout-perfect PDF generation.
- Cloud collaboration.
- Automatic upload or processing of private documents.

## Definition of Done

A compatibility feature is considered done only when it has:

- A clear supported scope.
- At least one public or synthetic sample.
- A manual or automated verification note.
- Documented limitations.
- A safe failure mode for unsupported structures.
