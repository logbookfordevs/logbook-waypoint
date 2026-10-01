# Development Guide

## Extension Development

```bash
pnpm install
pnpm --filter @logbookfordevs/waypoint-extension build
```

The unpacked production build is written to `packages/extension/.output/chrome-mv3/`.

Journal mode runs in the extension without the local server. Its storage model is `packages/extension/public/journal-model.js`; presentation and interaction live in `packages/extension/public/content/modules/journal-mode.js`. See the [Journal guide](JOURNAL_MODE.md) and [specification](specs/journal-mode.md) before changing its separation from the Agent Queue.

## Local Server Development  

```bash
pnpm --filter @logbookfordevs/waypoint start
```

## Testing

The automated suite covers product identity, generated extension output, and the loopback server security seam. Manual extension loading is deferred to the program gate and should be checked on common local setups:
- React: localhost:3000
- Vite: localhost:5173  
- Next.js: localhost:3000
- Vue: localhost:8080
