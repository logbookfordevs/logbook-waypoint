# Variant craft

A Variant Set earns its place through **divergence**: each Variant is a direction you could defend shipping on its own, a genuinely different answer to the same Annotation. Tints of one idea waste the comparison, because the user learns nothing by flipping between them. Divergence keeps the craft bar: every Variant individually works and is polished, since a sloppy Variant loses on execution and teaches nothing about its direction.

## 1. Scope

One Annotation, one piece of UI. When the request spans several components, choose the highest-leverage piece, say which and why, and offer the rest as follow-up Annotations. Restate the brief in one sentence: what the piece is, where it lives, and what it must do.

## 2. Recon

Map the ground every Variant stands on:

- **Stack**: framework, styling system (Tailwind, CSS Modules, styled-components, plain CSS), and motion library.
- **Tokens**: colors, radii, spacing, type, easing and duration variables.
- **Personality**: playful consumer app or crisp dashboard. This bounds how far the boldest Variant may go.
- **Context**: the Target's background, neighbours, and sizes from the Survey.

Recon is complete when you can name the styling system and the tokens the Variants will use.

## 3. Choose directions

Build the number of Variants the user requested, or 3 when none is stated. Before writing code, give each Variant a name and an axis: layout, density, personality, motion, or interaction model. Names describe the direction ("Quiet", "Editorial", "Dense"), never "Option A". Two directions that differ only in accent color or copy are one direction; replace one with a different layout, interaction model, or motion story. Shared project tokens are expected: every Variant should feel native to the product.

This step is complete when every Variant has a name and an axis and no two share an axis position.

## 4. Build in the project's styling system

Build every Variant in source as temporary Scaffold, written the way the project writes UI: Tailwind classes in a Tailwind project, CSS Modules where the project uses them, styled-components where components are styled that way. Each Variant fully works: real interactions, real motion, and product-shaped copy with plausible names and numbers.

Render the candidates side by side inside one Scaffold container, mark each candidate root with its key, and list the Scaffold identifier in each Variant's `scaffold`. Each Variant's `css` then only selects which candidate is visible:

```css
[data-waypoint-scaffold="pricing-card"] > [data-waypoint-variant]:not([data-waypoint-variant="quiet"]) {
  display: none !important;
}
```

Design stays in source, so the chosen Variant is already written in the project's idiom when the user keeps it. Use `pending_changes` alone only for Variants that differ in copy.

Motion meets a minimum bar unless the project's own easing and duration tokens say otherwise: `ease-out` on entrances, UI motion under 300ms, a `transform-origin` that matches where the element comes from, animation on `transform` and `opacity`, and a `prefers-reduced-motion` path.

## 5. Verify and present

Activate each Variant with `activate_variant` and confirm it renders, its interactions respond, and the console is clean; capture a screenshot of each when browser tooling is available. Return to the first Variant before handing off. If two Variants converged while you built them, cut one before submitting and say so: two distinct directions beat three padded ones.

Give every Variant a `summary`: one sentence naming its axis and when it wins. Waypoint shows it beside the Variant while the user flips through the set, so write it for the person choosing rather than for the code.

Present the set and wait for the user's choice in Waypoint:

| Variant | Axis | When it wins | Its cost |
| --- | --- | --- | --- |
| Quiet | Minimal motion, borders over shadows | The product is a daily-use tool | Least memorable |
| Editorial | Large type, generous whitespace | The moment deserves weight | Uses more vertical space |

Sell each Variant honestly, with one line on when it wins and one on what it costs, and keep the table neutral. If the user asks which you would choose, answer from the product's personality and frequency of use rather than aesthetics alone.

## 6. Riff

When the user wants another round around one direction, generate a fresh set that diverges around it and submit it with `replace_variants`.

---

Derived from the `prototype` skill in [emilkowalski/skills](https://github.com/emilkowalski/skills/tree/2d228630ba1446365f614a108cb8252f1feda202/skills/prototype), copyright © 2026 Emil Kowalski, MIT License.
