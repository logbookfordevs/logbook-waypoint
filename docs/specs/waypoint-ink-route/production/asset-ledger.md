# Waypoint Ink Route — Route A Asset Ledger

**Status:** Tracer-source assets produced on 2026-09-01. None is picture-locked or approved for full production.

| Asset / plate | Dramatic job | Source strategy / producer | Provenance / license | Runtime form | Segment | Opening? | Transfer / decoded estimate | Warm step | Fallback / release | Status / evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `chart-world-desktop-v1.webp` | Author the wide chart world, route corridor, paper relief, and Annotation destination | Generated and art-directed in the Director's Room with built-in image generation; finished to WebP locally | Original project generation using the Waypoint concept and user-supplied map-motion frames as references; production-rights review remains required before final lock | `1586 × 992` WebP | Hero → Annotation | Yes | `393,144 B`; about `6.0 MiB` decoded RGBA | Decode and upload before journey activation | Static image becomes the renderer-failure desktop cut | Tracer v1; `/private/tmp/waypoint-gpu-annotation-desktop-final.png` |
| `chart-world-mobile-v1.webp` | Supply a separately composed vertical camera corridor and mobile destination | Generated from the desktop board's material grammar, not cropped from it; finished to WebP locally | Original project generation; production-rights review remains required before final lock | `941 × 1672` WebP | Hero → Annotation | Yes on mobile | `454,116 B`; about `6.0 MiB` decoded RGBA | Decode and upload before journey activation | Static image becomes the renderer-failure mobile cut | Tracer v1; `/private/tmp/waypoint-gpu-annotation-mobile.png` |
| `ink-density-v1.webp` | Supply scanned-looking pooling, feathering, tendrils, droplets, and density variation for the live impact | Generated material study; failed alpha output was rejected; the selected pure-white density plate derives runtime alpha from luminance | Original project generation using the user-supplied ink-impact frame as material-behavior reference; production-rights review remains required before final lock | `1254 × 1254` lossless WebP density texture | Impact and route birth | Yes | `991,338 B`; about `6.0 MiB` decoded RGBA | Decode, upload, and draw once before the impact threshold | Omitted in the static fallback; content meaning remains | Tracer v1; `/private/tmp/waypoint-gpu-route-birth-mobile.png` |

The tracer currently transfers approximately `1.75 MiB` for the three selected assets and uploads approximately `18.0 MiB` of decoded texture data. It loads both desktop and mobile compositions so live resizing remains deterministic during the study. A production pass should lazy-load the inactive composition and recompress the density plate after the final material is selected.

## Source prompts

The production source used the built-in image-generation path. The generated originals remain in `/Users/leonardo/.codex/generated_images/01a05ce9-e557-72d3-ab45-917ce944a80d/`; the project consumes the finished WebP assets under `packages/website/public/ink-route/`.

### Desktop chart world

Create an original full-frame authored 2D/2.5D illustrated chart world on pale Driftwood Paper. Preserve a quiet lower-left origin and a diagonal camera corridor toward one restrained rust-red Annotation destination. Leave the live route unpainted. Use editorial ink-and-wash, engraved cartography, dry brush, torn paper relief, sparse bathymetry, and modern product precision in the Waypoint driftwood, blue-black, black-brown, and rust palette. Preserve negative space for live DOM copy. Exclude readable text, logos, UI chrome, ships, people, mascots, glossy vectors, stock-map imagery, and literal imitation of supplied references.

### Mobile chart world

Recompose the same material grammar as an original portrait `9:16` world rather than cropping desktop. Reserve the upper third for the useful hero, begin the journey below it, and direct a vertical camera corridor toward one lower-middle Annotation destination. Use edge occlusion and layered paper shelves without blocking UI zones. Preserve the same palette, analog material, and exclusions as desktop.

### Ink density

Create one top-down black-brown ink impact with dense pooling, capillary feathering, dry-brush loss, granular pigment, satellite droplets, and directional tendrils. The built-in tool twice baked a checkerboard instead of alpha; those outputs were rejected. The final requested form is dark material on perfectly uniform white so the GPU shader can derive density from luminance without matte contamination.

## Open asset decisions

- The world boards are representative tracer art, not final authored plates or editable layered masters.
- The current single-board parallax is a bounded shader proof; a production master may earn separately exported far, middle, and near plates.
- Final sound stems are not in this ledger. The live cut uses the synchronized procedural tracer mix; recorded or otherwise finished foley remains a later asset decision.
- No asset may expand into Queue, Agent, Resolution, or the full page before the tracer direction is approved.
