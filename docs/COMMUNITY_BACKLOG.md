# Community Backlog

These are starter issues for turning OpenHWP Studio from a useful alpha into the default open-source HWPX workbench for Korean document workflows.

The highest-value contribution is a public, synthetic, or sanitized HWPX/HWP sample plus expected behavior.

## Starter Issues

| Priority | Title | Labels | Why it matters |
| --- | --- | --- | --- |
| P0 | Browser compatibility pass for public samples | compatibility, good first issue | Proves that basic/media/diagnostic samples behave consistently on Chrome, Edge, Firefox, and Safari. |
| P0 | Add malformed XML HWPX fixture | compatibility, fixture, repair | Gives the package doctor a public broken XML case and protects blocked repair behavior. |
| P0 | Add section XML diff view after HWPX export | enhancement, diff | Shows exactly what text changed inside the source package, which builds trust for institutions. |
| P1 | Add relationship cleanup repair rule | enhancement, repair | Moves repair beyond missing `mimetype` into a real manifest cleanup workflow. |
| P1 | Add media thumbnail preview in Package Explorer | enhancement, media | Makes BinData and referenced images easier to audit without leaving the browser. |
| P1 | Add headers, footers, and footnotes fixture | compatibility, fixture | Turns common public-sector document structures into tested compatibility claims. |
| P1 | Add merged-table fixture and geometry warning | compatibility, table | Clarifies which table edits are safe and which require visual verification. |
| P2 | Pin CDN dependencies as local vendor assets | security, build | Improves offline readiness and reduces supply-chain uncertainty for sensitive document workflows. |
| P2 | Harden installed PWA offline mode | enhancement, offline | Pins runtime assets locally so the installed app can run without CDN access after install. |
| P2 | Add CLI validator using the same fixture contracts | cli, automation | Helps agencies, schools, and developers batch-check HWPX files outside the browser UI. |

## Issue Quality Bar

Good issues include:

- Browser and OS.
- File type: HWPX or HWP.
- Whether the file is public, synthetic, sanitized, or private.
- What worked.
- What failed.
- Expected behavior.
- Console errors or screenshots when safe.

Do not attach private legal, school, medical, finance, HR, government, or company documents unless you have permission to share them publicly.
