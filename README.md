# diyify
A project that helps with DIY project estimation and planning

## CI

`.github/workflows/ci.yml` runs lint, unit tests (`npm test`), and a production build on every push to `main` and every PR. The live Playwright suite (`npm run test:e2e`) is intentionally left out — it hits the real Claude API, costs tokens, and needs `ANTHROPIC_API_KEY`; run it manually.

## Prod
Visit https://diyify.vercel.app/ to see the deployed version of the app!
