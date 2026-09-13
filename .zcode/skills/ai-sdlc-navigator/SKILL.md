---
name: ai-sdlc-navigator
description: Navigate one software change through Plan, Design, Build, Test, Deploy, and Maintain while minimizing handoffs and artifacts.
disable-model-invocation: false
---

# AI SDLC Navigator

## Initialize an existing project

When asked to enable claude-sdlc in an existing project, run
`python <path-to-claude-sdlc>/scripts/init_sdlc.py <project-root>`. The target
must be a Git repository. Preserve existing `.sdlc/` files and
`sdlc.config.yaml`; create only missing files. Report the initialization result
and then inspect `.sdlc/INDEX.md`.

Guide one change through the six-stage lifecycle. Read
[`../../shared/lifecycle.md`](../../shared/lifecycle.md) and the project's
`.sdlc/INDEX.md` plus `.sdlc/lifecycle.yaml` before routing.
Use [`../../shared/capability-map.md`](../../shared/capability-map.md) to select
optional engineering primitives.

## Navigate

1. Run `python scripts/inspect_sdlc_state.py .` when the repository contains
   `.sdlc/lifecycle.yaml`. Read `.sdlc/INDEX.md` first, then inspect only linked
   artifacts and repository state. Done when the latest completed gate is known.
2. Classify risk using [`../../shared/risk-model.md`](../../shared/risk-model.md). Reuse an existing classification when its assumptions still hold. Done when process depth and required human gates are clear.
3. Invoke exactly one next-stage Skill and let it run its gate:
   - unclear or unaccepted intent: `ai-sdlc-plan`
   - accepted intent without an accepted solution: `ai-sdlc-design`
   - accepted design without a build candidate: `ai-sdlc-build`
   - build candidate without an independent verdict: `ai-sdlc-test`
   - accepted candidate not yet released: `ai-sdlc-deploy`
   - production signal, recovery, or learning: `ai-sdlc-maintain`
4. Report stage, source, gate, next action, and the one human decision needed, if any. Do not reproduce artifact contents.

When a human confirms a gate, record it with `python scripts/update_sdlc_state.py
set-gate <id> --gate <gate>` before advancing. A conversational confirmation is
not a lifecycle state change.

Do not manufacture missing gates from conversational confidence. A failed gate returns to the earliest invalid decision. Navigation is complete when the next stage or precise blocker is unambiguous.
