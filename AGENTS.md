# AGENTS.md

**d8pgroceries-agent** — Scriptable (iOS) grocery list parser and Publix/Instacart shopping assistant.

## Quick start
- Read `.github/copilot-instructions.md` for full architecture and conventions
- `npm install && npm test` to verify the test suite
- `npm run bundle` to produce the Scriptable-deployable single file

## Structure

    src/          — CommonJS modules (config, parser, narrative, gpt, url, ui, main)
    tests/        — Jest tests + mocks + fixtures
    scripts/      — bundle.js (concatenation script)
    dist/         — bundled output (publix-agent.js)
