# Compatibility Matrix

Last reviewed: 2026-06-18

OpenHWP Studio is an alpha, local-first browser workbench for Korean HWPX/HWP document workflows. This page records what is expected to work today, what is experimental, and what needs public sample documents before it can be called reliable.

## Support Levels

| Level | Meaning |
| --- | --- |
| Supported | Works in the current app for the listed scope and should be protected by future checks. |
| Partial | Useful today, but only for a subset of document structures or browser environments. |
| Preview only | The app can inspect or render the file, but editing/export guarantees are limited. |
| Experimental | Available in the UI, but behavior may change and needs more sample coverage. |
| Planned | Not implemented yet, but accepted as part of the product direction. |
| Out of scope | Not a near-term goal. |

## Document Features

| Area | Current level | Notes |
| --- | --- | --- |
| HWPX package open | Supported | Opens `.hwpx` ZIP packages and reads `Contents/section*.xml`. |
| HWP binary open | Preview only | Uses `@rhwp/core` for rendering/inspection paths. Editing is focused on HWPX. |
| Paragraph text extraction | Supported | Extracts paragraph text nodes from HWPX section XML. |
| Paragraph text editing | Supported | Edits extracted paragraph text in the browser editor. |
| HWPX source-preserving export | Partial | Writes edited paragraph text back into the original package when section XML is available. |
| New HWPX export | Experimental | Creates a simple document through `@rhwp/core` when possible; shows an explicit error instead of silently changing formats. |
| HWP export | Experimental | Uses `@rhwp/core` conversion paths and needs more real-world validation. |
| Accurate preview | Partial | Renders a page preview through `@rhwp/core`; coverage depends on the document feature set. |
| Search and replace | Supported | Works on the current editor view. |
| Outline and statistics | Supported | Counts paragraphs, characters, tables, and outline candidates from the editor state. |
| Korean document quality checks | Partial | Includes early heuristic checks; the rule set should grow from real office, school, and public-agency examples. |
| Tables | Partial | Existing tables are counted; inserted editor tables are simple HTML tables and are not yet full HWPX table round-trips. |
| Images and drawings | Planned | Needs package inspection, relationship handling, and export regression samples. |
| Headers, footers, footnotes | Planned | Not yet modeled in the editor. |
| Styles and layout fidelity | Partial | Basic paragraph classes and browser formatting exist; full HWPX style mapping is not implemented. |
| Comments, track changes, forms | Planned | Useful for public-sector workflows, but not part of the alpha surface. |
| Encrypted or password-protected files | Out of scope | Do not expect these files to open. |

## Export Formats

| Format | Current level | Notes |
| --- | --- | --- |
| HWPX | Partial | Best path for edited HWPX files with recognized `Contents/section*.xml`. |
| HWP | Experimental | Conversion depends on `@rhwp/core`. |
| TXT | Supported | Plain text export from editor paragraphs. |
| HTML | Supported | Simple HTML export/copy path for editor paragraphs. |
| Markdown | Supported | Simple Markdown copy path based on paragraph kinds. |
| JSON | Supported | Exports paragraph index, kind, and text for automation/debugging. |
| PDF | Partial | Browser print/PDF is available; this is not a layout-certified HWPX PDF renderer. |

## Browser Targets

| Browser/environment | Current level | Notes |
| --- | --- | --- |
| Chrome / Edge desktop | Primary target | Best expected experience for File APIs, Clipboard API, dynamic imports, and SVG preview. |
| Firefox desktop | Needs validation | Expected to work for core local file flows, but preview/export coverage should be reported with sample files. |
| Safari desktop | Needs validation | Needs explicit validation for dynamic WASM imports and file download behavior. |
| Mobile browsers | Planned | The current workspace is desktop-first. |
| Offline use | Partial | The app is local-first for documents, but the alpha build loads CDN assets. Pinning and self-hosting dependencies is required before claiming full offline support. |

## Data Handling

- Documents are opened in the browser from the user's local machine.
- The app is designed not to upload user documents to an application server.
- Alpha CDN dependencies still execute third-party-hosted code; production hardening should pin and self-host these assets.
- Do not attach private legal, school, medical, finance, HR, government, or company documents to public issues.

## How to Report Compatibility

Open a compatibility report with:

- Browser and OS.
- File type: `.hwpx` or `.hwp`.
- The document feature that failed: text, table, image, style, preview, export, or conversion.
- Whether a sanitized sample file can be shared.
- A screenshot or console error when available.

Public sample documents are the fastest way to improve this matrix.
