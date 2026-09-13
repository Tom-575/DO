---
name: ai-sdlc-test
description: Independently verify a build candidate against intent, design, and engineering policy for the Test stage of an AI-native SDLC.
---

# Test

Evaluate the candidate with fresh attention. Read [`../../shared/evidence-policy.md`](../../shared/evidence-policy.md) and the Test contract in [`../../shared/artifact-contracts.md`](../../shared/artifact-contracts.md).

1. Pin the candidate and its accepted intent/design. Identify the repository checks and change-specific evidence required. Done when every success criterion has a proposed observation.
2. Run the checks and inspect actual behavior. Add UI, migration, performance, compatibility, or security evidence only when the change calls for it.
3. Review the diff independently for correctness, spec fidelity, scope creep, policy violations, weakened checks, and unsupported claims.
4. Write a compact evidence record mapping criteria to results, with untested scope and residual risk. Return `pass`, `fail`, or `exception-required`.

Routine passes need no human review. Failure returns to Build, Design, or Plan at the earliest invalid decision. An exception requires an accountable approver.

Optional primitive: use `code-review` for an independent standards and
specification review; retain the Test artifact and verdict in this lifecycle.
