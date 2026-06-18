# Security

OpenHWP Studio handles local documents in the browser. Treat every document as untrusted input.

## Reporting

Please do not open a public issue for a vulnerability. Report privately to the repository owner once the GitHub repository is published.

## Current security posture

- Files are opened locally in the browser.
- The app does not upload user documents to a server.
- CDN dependencies are used in the alpha build.
- HWP/HWPX parsing is delegated to JSZip, browser XML APIs, and `@rhwp/core`.

## Before production use

- Pin and self-host third-party assets.
- Add dependency integrity checks.
- Add fuzz/regression samples for malformed HWPX packages.
- Add a strict Content Security Policy.
