---
name: ai-sdlc-plan
description: Turn an idea, request, opportunity, or incident into accepted intent for the Plan stage of an AI-native SDLC.
---

# Plan

Produce the smallest durable statement of what outcome is worth pursuing. Read the Plan contract in [`../../shared/artifact-contracts.md`](../../shared/artifact-contracts.md).

1. Gather the original request and authoritative context. For incoming issues, verify the claim before elaborating it. Done when facts, assumptions, and open decisions are distinguishable.
2. Resolve material ambiguity from the codebase and available sources. Interview the responsible human only for product choices the evidence cannot settle. Done when success can be judged without inventing intent later.
3. Classify risk with [`../../shared/risk-model.md`](../../shared/risk-model.md), then write or update the canonical record. Keep low-risk intent in the existing issue or conversation record; create a separate artifact only when durability requires it.
4. Ask the intent owner to decide only unresolved, consequential choices. Mark the Plan gate accepted when the problem, outcome, bounds, criteria, owner, and risk are explicit.

Planning ends at intent. Technical solution choices belong to Design.

Optional primitives: use `triage` for incoming work, `grilling` for unresolved
consequential choices, `research` for external facts, and `domain-modeling` when
project terminology is ambiguous. Continue locally when a primitive is absent.
