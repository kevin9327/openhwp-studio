# Contributing

OpenHWP Studio is early. The best contributions are small, reproducible, and tied to real HWPX/HWP documents.

## Good first issues

- Add sample documents that can be shared publicly.
- Improve HWPX structure detection.
- Add document quality rules for Korean business writing.
- Fix browser compatibility problems.
- Improve export correctness without breaking original package structure.

## Bug reports

Please include:

- Browser and OS
- File type: HWP or HWPX
- Whether the file can be shared
- What you expected
- What happened
- Console errors if available

Never upload private, legal, school, medical, finance, HR, or government documents unless you have permission to share them publicly.

## Development

```powershell
npm start
npm run check
```

Keep changes focused. If the fix touches export behavior, include a small public sample or a clear manual test note.
