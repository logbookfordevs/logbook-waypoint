# Waypoint sound effects

Every sound is synthesised in code (no samples, no third-party APIs) and encoded with `ffmpeg`.

```sh
node scripts/sfx/generate.mjs                  # rebuild everything into public/sfx
node scripts/sfx/generate.mjs ink-blob         # rebuild one sound
python3 -m http.server 8765                    # then open /scripts/sfx/audition.html
```

Output is deterministic (seeded). Edit `sounds.mjs` to change a sound; `dsp.mjs` holds the primitives.

## Cues

| Sound | When | Engine timing |
| --- | --- | --- |
| `ink-drip` | Drop lets go of the nib | Start at `ti = 0.3s`. The fall itself is silent |
| `ink-blob` | One short liquid plip as the ink lands | Start at `MOTION.impact` = 1.3s |
| `pen-draw-loop` | While a route leg is drawn | Loop for the leg. Drive `gain` from pen velocity and leave `playbackRate` at 1 |
| `checkpoint-arrive` | Leg lands on a checkpoint (small splash, two plucked notes) | `arriveAt()` |
| `paper-rustle` | A checkpoint card turns in | `showCard()` |
| `route-complete` | Arrival at the full-route overview | Final leg arrival |
| `ui-tick` | Button press | UI |
| `harbour-ambience` | Sunny shoreline bed under the whole journey | Loop, fade in about 2.5s, well below effects |
| `shanty-loop` | Optional music bed (original jig) | Loop, start after the intro at low gain |

## Direction

Light, liquid and sunny. Avoid low rumble, groaning timber, metal and bell partials: they read as heavy or eerie.
The ink is thin and wet; `ink-blob` is matched to a reference drip (about 880 Hz sliding up, 20 ms long).

## Constraints from `docs/specs/homepage-composition.md`

Audio must stay opt-in: no autoplay, no refresh-grants-permission assumption, and no fake controls.
Honour `prefers-reduced-motion` by also skipping `ink-drip`, and pause the bed when the page is hidden.
Loops are MP3 with gapless metadata. Decode them with `decodeAudioData` and loop the `AudioBuffer`.
