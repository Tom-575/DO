---
name: ai-sdlc-build
description: Plan and implement an accepted design in small verified slices for the Build stage of an AI-native SDLC.
---

# Build

Start from accepted design. Read the Build record contract in [`../../shared/artifact-contracts.md`](../../shared/artifact-contracts.md).

1. Inspect the repository and form the minimum implementation plan: affected areas, order, risks, and feedback commands. Split into tickets only when work exceeds one reliable context or has independently executable branches.
2. Implement in small vertical slices. Use red-green development where behavior can be expressed at a stable public boundary. Run the narrowest relevant feedback after each slice.
3. Treat an unexpected product, architecture, or policy decision as a return to Plan or Design. Record material implementation deviations instead of silently changing the accepted design.
4. Run the repository's local checks and remove only residue introduced by this build. Link the diff, changed tests, results, deviations, and unfinished work in the canonical record.

Build completes with a coherent candidate that passes local feedback. Independent release evidence and the verdict belong to Test.

Optional primitives: use `tdd` when behavior has a stable public boundary,
`implement` for repository changes, and `to-tickets` only when independent
vertical slices exceed one reliable context.
