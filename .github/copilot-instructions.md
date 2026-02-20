# d8pgroceries-agent — Copilot Instructions

## What this repo is

A Scriptable (iOS) app that parses messy grocery lists and walks the user through
Publix/Instacart searches one item at a time. Scriptable is a JavaScript runtime
for iPhone — its APIs (Alert, WebView, Safari, Request, Keychain) are iOS-only.

## Architecture: modular dev, monolithic deploy

Source code lives in `src/` as **CommonJS modules** — one concern per file, testable
in isolation via Jest. A bundle script concatenates them into a single file
(`dist/publix-agent.js`) that gets pasted into Scriptable on the phone.

### Module map

| Module | Responsibility | Testable in Node? |
|--------|---------------|-------------------|
| `src/config.js` | CONFIG object with settings and API key placeholder | Yes |
| `src/parser.js` | Rule-based grocery list extraction (pure functions) | **Yes — primary test target** |
| `src/narrative.js` | Heuristic: is this text messy enough to need GPT? (pure) | **Yes** |
| `src/gpt.js` | OpenAI Responses API integration (uses Scriptable Request) | Yes (mocked) |
| `src/url.js` | Instacart/Publix search URL builder (pure) | **Yes** |
| `src/ui.js` | Scriptable UI: input editor, preview, shopping loop | No (Scriptable-only) |
| `src/main.js` | Orchestration: ties all modules together | No (Scriptable-only) |

### Dependency order (for bundling)

config → parser → narrative → url → gpt → ui → main

## Build commands

    npm install        # install devDependencies (jest, eslint)
    npm test           # run Jest test suite
    npm run lint       # run ESLint
    npm run bundle     # concatenate src/ → dist/publix-agent.js

## Code conventions

- **CommonJS** (`require`/`module.exports`) — Scriptable doesn't support ESM
- **Pure functions** in parser.js, narrative.js, url.js — no side effects, no globals
- **Scriptable globals** isolated to ui.js, gpt.js, and main.js — these use Alert, WebView, Safari, Request, Keychain
- **No `fetch()` or Node `http`** — use Scriptable's `Request` class for HTTP
- **Error objects** include a `.help` property with a user-friendly message

## Testing conventions

- Test runner: **Jest**
- Test files: `tests/<module>.test.js` (mirror src/ structure)
- Scriptable API mocks: `tests/__mocks__/scriptable.js` — provides stub classes for Alert, WebView, Safari, Request, Keychain
- Test fixtures: `tests/fixtures/*.txt` — sample grocery list inputs with known expected outputs
- **Every pure-function module must have tests.** UI modules (ui.js, main.js) are lint-only.
- **No real HTTP calls in tests.** Mock the Request class.
- **Tests must be deterministic** — no randomness, no Date.now() dependencies.

## Security rules (HARD)

- **NEVER commit API keys, tokens, or secrets** to any file in this repo
- `src/config.js` uses the placeholder string `"OPENAI_API_KEY_HERE"` — never a real key
- On-device, the script uses Scriptable's `Keychain.get("OPENAI_API_KEY")` for secure storage
- `.gitignore` must include: `.env`, `config/`, `*.key`, `*.secret`
- `dist/publix-agent.js` must not contain real API keys

## Scriptable API reference (for mocking)

These are **global classes** in Scriptable — no import needed on-device. In Node tests, they must be mocked.

- `Alert` — `.title`, `.message`, `.addAction(label)`, `.addCancelAction(label)`, `.addTextField(placeholder, text)`, `.textFieldValue(index)`, `.present()` → Promise\<number\> (-1 for cancel)
- `WebView` — `.loadHTML(html)`, `.present(fullscreen)` → Promise\<any\>
- `Safari` — `.open(url)` (static method)
- `Request(url)` — `.url`, `.method`, `.headers`, `.body`, `.loadJSON()` → Promise\<object\>
- `Keychain` — `.get(key)` → string|null, `.set(key, value)`, `.contains(key)` → boolean (static methods)

## WISDOM.md — contributing agent insights

`WISDOM.md` at the repo root captures transferable best practices about agentic
development. When you encounter something during implementation that would help
this developer write better specs, instructions, or issues in future projects,
append it under the "From the build phase" heading.

**What belongs:** workflow patterns, agentic environment gotchas, structural
decisions that prevented error classes, friction between human intent and agent
execution, anything transferable to other projects.

**What does NOT belong:** code-level details, debugging narratives, app-specific
implementation choices, redundant restatements of this instructions file.

Keep entries short (2-4 sentences). Focus on the generalizable principle.
