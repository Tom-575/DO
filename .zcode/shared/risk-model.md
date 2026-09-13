# Risk Model

Classify risk from blast radius, reversibility, data sensitivity, external effect,
and uncertainty. Use the highest applicable tier.

| Tier | Typical change | Autonomy |
|---|---|---|
| Low | local, reversible, no sensitive data or external effect | agent advances through gates using repository checks |
| Medium | cross-module behavior, migration with rollback, user-visible change | human accepts intent/design; agent advances until production approval |
| High | destructive or irreversible action, security boundary, regulated data, broad migration, material production impact | named humans approve design exceptions and production action |

Increase the tier when evidence is weak or the affected system is poorly
understood. Lower it only when new evidence removes that uncertainty.

Risk changes process depth, not the six-stage model. Low-risk work may keep plan,
design, and test evidence in one issue or PR. High-risk work needs explicit records,
approvers, rollout, rollback, and retained evidence.
