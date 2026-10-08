# Waypoint experiment archive

Branch index verified on **2026-10-08**. These experiments were alternative website directions, not alternative Waypoint products.

## Publishing decision

Keep the independent experiments unpublished for now. Do not add a temporary Labs gallery or new experiment routes to the official Waypoint homepage. Revisit their presentation when the official Logbook Labs website exists.

**Editorial Adventure is the exception:** its interaction was promoted into the official homepage. Keep the original experiment as source provenance, not as a future Labs exhibit by default.

Logbook Labs can eventually own curation and presentation without requiring every experiment's source or runtime to move out of this repository. Hosting, embedding, and migration remain undecided.

## Preserved branches

All five local branch tips matched their live GitHub branch tips at verification. The commit links below identify the recorded snapshots even if a branch moves later. No archive tags were created as part of this index.

| Experiment | Technology | Branch | Recorded snapshot | Route on that branch |
| --- | --- | --- | --- | --- |
| Living Field Guide | Rive | [`feat/lab-living-field-guide`](https://github.com/logbookfordevs/logbook-waypoint/tree/feat/lab-living-field-guide) | [`98438c9`](https://github.com/logbookfordevs/logbook-waypoint/commit/98438c90f1317da1c113e8c4ee824f0fbb8cacf7) | `/labs/rive` |
| Directed Voyage | Theatre.js | [`feat/lab-directed-voyage`](https://github.com/logbookfordevs/logbook-waypoint/tree/feat/lab-directed-voyage) | [`826b5ac`](https://github.com/logbookfordevs/logbook-waypoint/commit/826b5ac17f39586ea2749674c38bb51ac09e6d41) | `/labs/theatre` |
| Living Atlas | PixiJS | [`feat/lab-living-atlas`](https://github.com/logbookfordevs/logbook-waypoint/tree/feat/lab-living-atlas) | [`1a85a47`](https://github.com/logbookfordevs/logbook-waypoint/commit/1a85a47bb0adb2b6351d6be90c1f6ee58e8227ad) | `/labs/pixi` |
| Chartroom Diorama / Atlas Storybook | Three.js | [`feat/lab-chartroom-diorama`](https://github.com/logbookfordevs/logbook-waypoint/tree/feat/lab-chartroom-diorama) | [`3d7eab4`](https://github.com/logbookfordevs/logbook-waypoint/commit/3d7eab4f4e7d608b0f8b493ee930f5223734e3f5) | `/lab/storybook` (singular `lab`) |
| Editorial Adventure — promoted | Motion | [`feat/lab-editorial-adventure`](https://github.com/logbookfordevs/logbook-waypoint/tree/feat/lab-editorial-adventure) | [`50a6588`](https://github.com/logbookfordevs/logbook-waypoint/commit/50a65889e84cf430709e267a7e09bdc3ff9037d0) | `/labs/margin` |

These routes describe the archived implementations. They are not a statement that the routes are deployed or available on the current production website.

## Where to resume

Paths below are relative to the repository **on the corresponding branch or snapshot**, not necessarily present on the current homepage branch. Production notebooks and media retain historical QA evidence; this index does not claim a fresh creative or runtime acceptance pass.

| Experiment | Source | Direction and preserved evidence |
| --- | --- | --- |
| Living Field Guide | `packages/website/app/labs/rive/`; authoring source in `packages/website/rive/field-guide/`; runtime assets in `packages/website/public/labs/rive/` | `docs/specs/waypoint-rive-lab/production/` |
| Directed Voyage | `packages/website/app/labs/theatre/` | Recovery guide and media: `docs/references/waypoint-theatre-lab/README.md`; direction: `docs/specs/waypoint-theatre-lab/production/` |
| Living Atlas | `packages/website/app/labs/pixi/`; `packages/website/components/pixi-lab/` | `docs/specs/waypoint-pixi-lab/production/` |
| Chartroom Diorama | `packages/website/app/lab/storybook/`; `packages/website/components/storybook-lab/` | `docs/specs/waypoint-storybook-lab/` |
| Editorial Adventure | Original: `packages/website/app/labs/margin/`; promoted homepage interaction: `packages/website/components/editorial-demo.tsx` on the homepage branch | Original direction and media: `docs/specs/waypoint-margin-lab/production/` |

## Recover an experiment later

Use a separate checkout of the desired branch or recorded commit; do not switch a dirty homepage checkout to an experiment branch. Read that experiment's notebook and any recovery guide first, then use its locked dependencies:

```sh
pnpm install --frozen-lockfile
pnpm --filter @logbookfordevs/waypoint-website dev --hostname 127.0.0.1 --port 3023
```

Choose a free port and visit the corresponding route above. Run one heavy browser/GPU preview or QA session at a time, following the shared QA coordination protocol in the experiment's notebook. Do not start all five previews together.

The five experiment worktrees were checked for uncommitted changes when this index was created: each had only an untracked `.codex/environments/` directory. That machine-local launcher configuration is not part of the recorded snapshots. Preserve or inspect it separately if it becomes needed before retiring a worktree.

When Logbook Labs is ready, curate which experiments to present, recover from the snapshots, and assess runtime isolation and hosting then. Do not assume their old dependencies or historical QA results still guarantee compatibility.
