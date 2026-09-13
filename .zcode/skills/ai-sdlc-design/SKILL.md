---
name: ai-sdlc-design
description: Convert accepted intent into a policy-aware solution and validation strategy for the Design stage of an AI-native SDLC.
---

# Design

Start from accepted intent. Read the Design contract in [`../../shared/artifact-contracts.md`](../../shared/artifact-contracts.md).

1. Explore the affected code, domain language, decisions, interfaces, and policies. Done when every affected boundary and material constraint is accounted for.
2. Resolve uncertain design questions with research or a disposable prototype when inspection cannot answer them. Compare alternatives only when the choice changes cost, behavior, risk, or reversibility.
3. Select the smallest solution that meets the intent. Define behavior and data contracts, validation strategy, rollout implications, and policy conflicts.
4. Record decisions in the canonical issue or spec. Low-risk work may append a concise Design section to the intent. Use a separate spec for broad or high-risk changes.
5. Obtain human judgment only for material tradeoffs or policy exceptions. The gate passes when Build can proceed without inventing product or architecture choices.

Implementation sequencing and file-level tactics belong to Build.

Optional primitives: use `prototype` for cheap behavioral exploration,
`codebase-design` for module seams, `domain-modeling` for vocabulary, and
`research` for external API or policy facts.
