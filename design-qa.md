# OpenDesign → React fidelity QA

Date: 2026-10-07  
Final result: **passed**

## Comparison target

Source: OpenDesign project `7333dca3-2b63-4c9a-b836-70106cf96726`, served unchanged at `http://127.0.0.1:3040`. Production reference copies live under `docs/references/waypoint-opendesign/`.

Implementation: existing Next.js / React / TypeScript website, homepage `/`, development preview at `http://127.0.0.1:3041`, built standalone preview at `http://127.0.0.1:3042`.

Comparisons use the same checkpoint, light theme, copy, 1× screenshot density, and viewport. In each combined image, **source is left, React is right**:

- [Desktop Annotate: 1280 × 720 per side](docs/references/waypoint-opendesign/qa/desktop-annotate-comparison.png)
- [Portrait Check results: 390 × 844 per side](docs/references/waypoint-opendesign/qa/mobile-results-comparison.png)

The map has continuous subtle camera drift. Separately timed captures therefore have a small background phase difference; this is not claimed to be a bit-identical animation-frame comparison. Authored geometry, shaders, motion constants, font families/weights, and CSS are preserved.

## Findings and iteration history

1. **[P2, fixed] Portrait rules lost precedence during CSS scoping.** Desktop `.ink-map` selectors outweighed the original unscoped portrait selectors, leaving desktop-sized controls on a narrow viewport. Scoped portrait rules consistently, recaptured both implementations at 390 × 844, and compared the combined image. Card boundaries, text wrapping, rail density, and bottom controls now match.
2. **[P2, fixed] Agent code block lost an authored newline in JSX.** JSX whitespace normalization joined lines. Restored the literal string inside `<code>` and verified the separate command, note, and status lines in the browser.
3. A source portrait capture initially used mismatched browser screenshot metrics. Recreated the source tab using the browser's viewport control, verified `innerWidth=390` / `innerHeight=844`, and replaced the invalid capture before judging fidelity.

No remaining actionable P0/P1/P2 visual differences were found in the final comparisons.

## Fidelity surfaces

- **Typography:** Poppins, Literata, and IBM Plex Mono, source weights and sizing, heading wrapping, and body measure match. Fonts are locally served rather than fetched from Google.
- **Spacing/layout:** floating card placement, leader, checkpoint rail, lower controls, responsive card width, padding, and dividers match at the compared viewports.
- **Colors/tokens:** paper, surface, dark ink, signal, verdigris, borders, and selected-state values retain the source tokens. The journey remains light regardless of documentation theme.
- **Art/assets:** original procedural paper/contour shader, splat geometry, route geometry, Three.js version r149, marker textures, and inline SVG are retained. No screenshots or newly generated approximations replace live scene content. Reference HTML and vendor script hashes match the source files exactly.
- **Copy/content:** authored station copy, headings, labels, chips, queue, code example, outcomes, attribution, and replay text are retained. This fidelity pass does not silently rewrite product vocabulary.

## Behavioral verification

- Browser: intro, Set course, timed travel and hold at Annotate, Queue, Agent pick, Check results, Full route, Replay, and direct checkpoint navigation.
- Browser: reduced-motion checkpoint navigation is immediate; corrected code block retains its lines.
- Browser: production preview loads real WebGL and locally served assets; no console warnings/errors observed in the inspected page states.
- Browser: with JavaScript disabled, all six stations remain readable as static field notes.
- Regression tests: destination holds, back/replay, checkpoint/keyboard navigation, reduced motion, renderer/listener/frame cleanup, and unavailable/lost WebGL fallback.

## Mechanical verification

All passed:

```bash
pnpm --filter @logbookfordevs/waypoint-website check
pnpm --filter @logbookfordevs/waypoint-website lint
pnpm --filter @logbookfordevs/waypoint-website test
pnpm --filter @logbookfordevs/waypoint-website build
pnpm --filter @logbookfordevs/waypoint-website start --hostname 127.0.0.1 --port 3042
```

Tests: **10 files, 25 tests passed**. Lint is intentionally scoped to the new journey implementation and site-chrome integration, not a claim of repository-wide lint coverage. Production build generated the homepage and existing documentation routes.

## Open questions and residual gaps

None blocking the faithful port. Physical iOS/Android devices, Safari/Firefox, sustained GPU performance, and assistive-technology user testing were not exercised. Portrait checks are browser viewport tests, not claims of physical-device coverage. This pass does not add narration, change the approved art direction, publish a release, or integrate a live annotation queue.

## Implementation checklist

- [x] Preserve the original source as a provenance reference.
- [x] Port to real React markup and a typed renderer with resource cleanup.
- [x] Fix and recapture portrait specificity and code-block whitespace regressions.
- [x] Compare source and implementation together at matching desktop/portrait states.
- [x] Run website tests, typecheck, scoped lint, and production build.
- [x] Verify the standalone production preview with locally served assets.

## Follow-up polish

None required for the supplied design's fidelity. Any new install/docs navigation, copy corrections, narration, or art-direction changes should be evaluated separately rather than folded into this port.
