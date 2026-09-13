---
name: ai-sdlc-maintain
description: Diagnose production signals, restore service, and convert operational learning into the next SDLC improvement during Maintain.
---

# Maintain

Handle a production signal or scheduled health task. Read the Learning contract in [`../../shared/artifact-contracts.md`](../../shared/artifact-contracts.md).

1. Establish impact and a reliable signal. Prefer deterministic alerts and measurements; use the agent to correlate evidence and explain it. Done when the condition and affected scope are known well enough to act.
2. Work within the pre-authorized control band: observe, diagnose, prepare a change, or invoke an approved recovery procedure. Escalate when the required action exceeds delegated authority.
3. Restore and verify service before pursuing broad improvement. Record the signal, impact, recovery, cause, and supporting evidence.
4. Route each durable lesson to exactly the right control:
   - behavior recurrence: regression test or eval
   - reusable procedure: Skill or runbook
   - project knowledge or decision: project instructions or ADR
   - inviolable constraint: hook, CI rule, permission, or sandbox
   - new product work: a new Plan intent
5. Close Maintain when service is stable and every material lesson has either a durable destination or an explicit owner.

An incident is not fully closed merely because the immediate symptom disappeared.

Optional primitives: use `diagnosing-bugs` for reproduction and performance
loops, `triage` for impact classification, and an architecture-improvement
primitive when recurring friction indicates structural work.
