# WISDOM.md — Agentic Development Best Practices

> Accumulated insights from building with AI coding agents.
> Contextualized to a solo, non-professional developer on macOS
> working with GitHub Copilot Coding Agent and VS Code.
> Intended to be portable — carry this forward to future projects.

---

## From the planning phase

### 1. Instructions go in the repo, not just issue bodies

The Coding Agent reads `.github/copilot-instructions.md` automatically before
it touches anything. That file is your constitution — it can't be corrupted
by the agent's own work. Put "how to build" in the repo; put "what to build"
in the issue.

### 2. Single comprehensive issue > decomposed chain (for small projects)

Over-decomposing into many small issues creates orchestration complexity
(dependency chains, auto-merge workflows, sequential assignment) that dwarfs
the actual work. For projects under ~1,000 LOC, one detailed issue is simpler
and produces one reviewable PR.

### 3. The planning conversation is the product

The back-and-forth between human and AI refined 6 issues + auto-merge chain +
manual bootstrap down to 1 issue + zero manual work. No single-shot prompt
would have found that path. Budget time for the conversation — it's not
overhead, it's where the design happens.

### 4. Modular dev, monolithic deploy

When the target runtime is platform-locked (Scriptable, iOS Shortcuts, embedded
scripts, etc.), develop as testable modules and bundle into one file for
deployment. This is the single decision that makes the project testable in
a Linux codespace when the real runtime is an iPhone.

### 5. Test fixtures with exact expected outputs are the strongest guardrail

Vague test descriptions ("should parse correctly") give the agent room to write
tests that pass but don't verify the right thing. Literal expected arrays
(`["Bananas", "eggs", "milk"]`) are unambiguous. The agent either matches them
or it doesn't.

### 6. Security rules must be structural, not advisory

Telling an agent "don't commit secrets" is weaker than making it structurally
impossible: `.gitignore` patterns, placeholder constants, Keychain integration,
and acceptance criteria that search output files for keys. Defense in depth
works on agents too.

### 7. Separate pure functions from platform globals

If you isolate platform-specific code (Scriptable's Alert, WebView, Safari) into
dedicated modules and keep everything else pure, the pure modules are testable
anywhere. This is the architectural decision that lets a Linux codespace validate
an iOS-only app.

### 8. The "fully agentic" constraint is clarifying, not limiting

Requiring zero human intervention during the build forced us to make the spec
self-sufficient — exact expected outputs, exhaustive acceptance criteria,
structural security. These qualities make the spec better even if a human
were building it.

---

## From the build phase

*The Coding Agent may append additional insights below as it works.*
