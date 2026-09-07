# Contributing to Logbook Waypoint

Thanks for helping chart Waypoint's direction. The project is early, local-first, and intentionally careful about the boundary between browser-captured context and coding agents.

## Before you start

For a bug fix, open or reference an issue that explains the observed and expected behavior. For a larger feature, describe the user problem, the smallest useful outcome, and any contract or security boundary it affects before investing in an implementation.

Keep changes focused. A pull request should solve one coherent problem and avoid unrelated cleanup.

## Repository map

- `packages/extension/` contains the WXT browser extension and its tests.
- `packages/server/` contains the local MCP server, HTTP API, persistence, and tests.
- `packages/website/` contains the Next.js marketing and documentation site.
- `docs/contracts/` records behavior that extension and server consumers may rely on.
- `docs/adr/` records architectural decisions and their trade-offs.
- `docs/specs/` contains accepted product specifications.
- `CHANGELOG.md` and `packages/server/CHANGELOG.md` contain product-facing release notes.

Start with the [documentation map](docs/README.md) when a change touches an unfamiliar workflow.

## Local setup

Waypoint uses pnpm and Node.js 22 or newer.

```bash
pnpm install
pnpm check
pnpm test
pnpm build
```

The server test suite opens loopback ports. If your environment restricts local binding, rerun those tests in an environment that permits `127.0.0.1` listeners before treating an `EPERM` failure as a product regression.

### Run the local server

```bash
pnpm --filter @logbookfordevs/waypoint start
```

The MCP endpoint is `http://127.0.0.1:3846/mcp`.

### Website Development

1. Install dependencies from the repository root with `pnpm install`.
2. Run the website package through your preferred Next.js development workflow.
3. Run `pnpm --filter @logbookfordevs/waypoint-website test` for rendered-DOM behavior.
4. Run `pnpm --filter @logbookfordevs/waypoint-website check` and `pnpm --filter @logbookfordevs/waypoint-website build` before handoff.

### Load the extension

1. Run `pnpm build`.
2. Open `chrome://extensions` in a Chromium browser.
3. Enable **Developer mode**.
4. Choose **Load unpacked**.
5. Select `packages/extension/.output/chrome-mv3/`.

Build output under `.output/` is generated and should not be committed.

## Change expectations

- Preserve the loopback-only server and untrusted-page-content boundaries documented in [SECURITY.md](SECURITY.md).
- Keep Annotation lifecycle transitions inside the lifecycle interfaces; generic updates and synchronization must not bypass them.
- Preserve canonical product, storage, package, MCP, and Annotation identifiers.
- Keep compact MCP survey responses distinct from complete diagnostic inspection.
- Treat single-Target and multi-Target records as supported input shapes unless a new contract explicitly replaces that compatibility.
- Prefer clear names and small, explicit interfaces over comments that narrate implementation history.
- Add regression tests for meaningful behavior changes and bug fixes.
- Update the relevant contract, ADR, guide, or changelog when public behavior or an architectural decision changes.

The existing code style is the guide for JavaScript. Use two-space indentation and keep commit subjects imperative, focused, and at most 72 characters.

## Changelog

Every user-visible capability, behavior change, bug fix, removal, installation change, or contributor/release workflow change needs a concise entry under `Next Release`:

- Use the root [CHANGELOG.md](CHANGELOG.md) for extension UX, cross-product workflows, documentation semantics, and whole-project behavior.
- Use [packages/server/CHANGELOG.md](packages/server/CHANGELOG.md) for package-specific MCP, HTTP API, persistence, CLI, or server behavior.
- When one change materially affects both audiences, add a scoped entry to each changelog instead of copying the same sentence.

Put each entry in exactly one category: `Added` for a new capability, `Changed` for altered behavior or guidance, `Fixed` for a user-visible defect, or `Removed` for an intentionally withdrawn surface. Describe the outcome for users or upgrade reviewers—not helper extraction, test plumbing, refactors, or other implementation receipts.

Before submitting, check that the entry matches the current behavior, is not duplicated across categories, and was not added to an already released version.

## Validation

Run the narrowest relevant test while developing, then complete the repository checks before opening a pull request:

```bash
pnpm check
pnpm test
pnpm build
```

For extension UI changes, also reload the unpacked extension and exercise the affected path on a local page. Include the browser, route, and manual result in the pull request. Screenshots are useful for visible changes.

## Pull requests

A useful pull request includes:

- the user problem and resulting behavior;
- the important implementation decisions;
- automated and manual validation performed;
- known limitations or intentionally deferred work;
- documentation or contract changes, when applicable.

Do not claim a test or manual check that was not actually run. Keep generated files, local annotation data, credentials, and unrelated formatting out of the diff.

## Releases

Publishing the npm package, Chrome extension, tags, or releases is a maintainer operation. A merged pull request is not evidence that a release has been published or deployed.

## Conduct and security

Participation is governed by the [Code of Conduct](CODE_OF_CONDUCT.md). Report vulnerabilities through the process in [SECURITY.md](SECURITY.md), not through a public issue.
