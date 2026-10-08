# Waypoint Ink Map Journey — source reference

Approved source: OpenDesign project `7333dca3-2b63-4c9a-b836-70106cf96726`, captured on 2026-10-07 from:

```text
/Users/leonardo/Library/Application Support/Open Design/namespaces/release-stable/data/projects/7333dca3-2b63-4c9a-b836-70106cf96726
```

`index.html` and `vendor/three.min.js` are unchanged reference copies, not the production app. The source has no package manifest, README, or DESIGN.md. Its CSS, inline SVG, shaders, route geometry, camera choreography, copy, and interactions are authoritative for this port.

Production stays in the existing Next.js / React / TypeScript website:

- `packages/website/components/ink-map-journey.tsx`: real React markup.
- `packages/website/components/ink-map-engine.ts`: typed Three.js renderer and journey controller, with mount/unmount resource cleanup.
- `packages/website/app/styles/ink-map.css`: authored styles scoped to the journey; portrait rules retain their intended specificity.

Three.js is pinned to the source's r149 (`0.149.0`). The reference vendor file retains its MIT license header. Fonts use the workspace's local Fontsource packages instead of Google Fonts requests. No reference screenshot is used as a raster replacement for live content.

Integration changes are limited to React lifecycle/resource disposal, locally served fonts, a skip link, reduced-motion flash removal, and a readable fallback if WebGL is lost. Existing `/docs` routes retain their own site header/footer. This is the authored visual journey, not a live annotation backend demo; it does not imply a published extension or npm package. Narration is not present in this OpenDesign source and was not added during the faithful port.

For commands, see the repository README. Fidelity evidence and verification are recorded in root `design-qa.md`.
