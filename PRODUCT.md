# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

The product consists of a WXT browser extension and a local Node.js MCP server. The planned marketing and documentation website will use Next.js with React, TypeScript, Tailwind CSS v4, and Vercel.

## Users

The primary users are developers building interfaces with coding agents who need to turn visual feedback on a running local application into structured, actionable work. The product should also feel native to frontend developers and design engineers who care about precise element context, styling, variants, and implementation quality.

## Product Purpose

Logbook Waypoint connects feedback placed directly on a development interface to coding agents. A developer annotates a page or element, Waypoint preserves the relevant context in a local Queue, and an MCP-compatible agent can watch, inspect, claim, and resolve that work.

Success means the developer can stay close to the rendered interface while the agent receives enough structured context to act without the developer manually translating every visual observation into a separate prompt.

## Positioning

Waypoint turns precise visual feedback into a local, lifecycle-aware Queue that coding agents can watch and resolve. It combines in-page annotation with agent-readable context, retained work state, and explicit design workflows rather than treating feedback as disposable clipboard text.

## Operating Context

- A developer runs a local web application and enables the Waypoint browser extension for the relevant routes.
- The developer places point or element Annotations, optionally adding screenshots, attachments, element edits, Design Intent, or Variant Intent.
- A loopback-only local server persists the Queue and exposes it to MCP-compatible coding agents.
- Agents can Watch for work, inspect complete Annotation context, Claim work, and retain Resolved or Discarded history.
- Waypoint owns Variant evaluation, Active Variant state, Scaffold cleanup, and Finalization.

## Capabilities and Constraints

- Waypoint is local-first. Its server binds to IPv4 loopback and keeps its active security boundary local.
- The current product has a WXT Chromium extension and a local Node.js MCP server.
- Annotations support targets, comments, screenshots, attachments, element-edit context, lifecycle state, Watch delivery, Design Actions, and named Variants.
- Design Actions depend on Impeccable but remain inside Waypoint's Queue and lifecycle model.
- Waypoint begins with fresh storage and does not migrate data from predecessor products.
- The browser extension is published in the Chrome Web Store. The CLI and local MCP server are published through npm and checksummed GitHub Releases; the website keeps these installation paths distinct.
- The planned first website scope is a Persuade landing page plus a coherent documentation shell. A project-progress-led homepage remains a future variation, not the initial conversion thesis.

## Brand Commitments

- Product name: Logbook Waypoint.
- Tagline: “Pin the point. Chart the change.”
- Waypoint is a Logbook for Devs tool and follows the Atlantic Chartroom brand system.
- Marketing uses the Ocean recipe; documentation uses Walnut within the Ocean site shell.
- Maritime language is a light structural metaphor, never pirate role-play.
- Thelu is the Logbook for Devs mascot and may support welcome, guidance, progress, and editorial moments without displacing the product mechanism.
- Required attribution: “A tool from the Logbook for Devs” linking to `https://logbookfordevs.com/`.
- Required tagline: “Charting the technical seas, one commit at a time.”

## Evidence on Hand

- The working extension and server source are the primary product proof.
- `README.md` documents the current architecture, capabilities, security boundary, development setup, and project lineage.
- `CONTEXT.md`, `docs/contracts/`, and `docs/adr/` contain the canonical domain and behavioral contracts.
- `docs/images/logbook-waypoint-banner.png` is existing README artwork, not visual authority for the website. Its AI Field Kit-derived palette, texture, and fantasy-map treatment must not determine the Waypoint site direction.
- `assets/thelu-logbook/` contains approved Thelu and Waypoint illustration assets.
- No testimonials, customer logos, adoption metrics, benchmarks, pricing, or store availability claims are currently approved; the website must not fabricate them.

## Product Principles

1. Keep feedback close to the rendered interface and useful to the agent that will act on it.
2. Preserve a trustworthy Queue and lifecycle instead of reducing feedback to disposable prompt text.
3. Keep the local security boundary explicit and inspectable.
4. Let Waypoint own workflow state while external disciplines such as Impeccable contribute expertise.
5. Make advanced context available without making ordinary Annotation work noisy.

## Accessibility & Inclusion

The website and product UI must meet WCAG AA contrast, preserve visible keyboard focus, support zoom and text reflow, avoid color-only meaning, and respect reduced-motion and forced-color preferences.
