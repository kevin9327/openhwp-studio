# Launch Plan

Goal: become the Korean default open-source HWPX workbench, not just another HWP viewer.

## Honest read

The current alpha is worth publishing if it is framed correctly:

- Good: local-first HWPX editing, quality checks, simple conversion exports, clean web UI.
- Weak: not yet a full Hancom replacement, limited table/image/control editing, CDN-based alpha.
- Opportunity: Korean users need document repair, inspection, diff, and automation more than another read-only viewer.

## Positioning

One sentence:

> OpenHWP Studio is a local-first browser workbench for inspecting, repairing, editing, and converting Korean HWPX/HWP documents.

Avoid claiming:

- "Full Hancom replacement"
- "Perfect HWP editing"
- "100% compatibility"

Claim:

- "HWPX structure-preserving editing"
- "Powered by rhwp"
- "Local-first"
- "Document doctor for Korean HWPX workflows"

## What can make it number one

1. Public demo with sample HWPX files
2. Before/after screenshots
3. Compatibility matrix by document feature
4. HWPX repair/diff tools
5. AI-assisted Korean document cleanup that never uploads files by default
6. Browser extension or PWA install
7. CLI batch converter for public agencies and schools
8. A small test corpus of public Korean documents

## First 7 days

- Publish GitHub repository with MIT license.
- Add screenshots and a GIF.
- Add 3 public sample HWPX files.
- Open issues for roadmap items.
- Submit to GitHub topics: `hwp`, `hwpx`, `hancom`, `korean`, `document-editor`, `rhwp`.
- Post Korean launch note: "한컴 없이 HWPX 열고 고치는 로컬 웹앱".

## First 30 days

- Replace CDN build with pinned local vendor assets.
- Add HWPX package inspector.
- Add diff view between original and edited HWPX XML.
- Add repair rules for missing `Contents/section*.xml`, broken relationships, empty paragraphs, and invalid XML.
- Add export regression tests.
