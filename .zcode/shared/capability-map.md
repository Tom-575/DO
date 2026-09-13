# Capability Map

The lifecycle Skills are the stable public workflow. Existing engineering Skills
are optional primitives selected by stage and task shape.

| Stage | Optional primitive | Use when |
|---|---|---|
| Plan | grilling / triage | intent is ambiguous or arrives as an external request |
| Plan | research / wayfinder | a decision depends on external facts or spans sessions |
| Plan | domain-modeling | project language or terminology is unclear |
| Design | prototype | behavior or UI is cheaper to decide with a rough artifact |
| Design | codebase-design | module depth, seam, or interface shape is uncertain |
| Design | research | an external API, policy, or technical fact is unknown |
| Build | implement / tdd | an accepted design is ready for code |
| Build | to-tickets | work has independent vertical slices or exceeds one context |
| Test | code-review | correctness, standards, and spec need independent review |
| Maintain | diagnosing-bugs | a production issue needs a tight reproduction loop |
| Maintain | improve-codebase-architecture | recurring friction suggests structural improvement |

The adapter may call an installed primitive by name, or perform the equivalent
work locally when that primitive is unavailable. The lifecycle artifact and gate
remain owned by `claude-sdlc`, not by the external primitive.
