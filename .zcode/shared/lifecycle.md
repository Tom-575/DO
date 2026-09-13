# Lifecycle

The six stages are `plan -> design -> build -> test -> deploy -> maintain`.
`maintain` feeds new evidence and work back into `plan`.

Each stage has one canonical record. A record may be a section of an issue or PR,
not necessarily a separate file. Link to existing evidence instead of copying it.

## Transitions

| Stage | Entry | Exit |
|---|---|---|
| Plan | idea, request, incident, or opportunity | plan is explicit and decision-ready |
| Design | accepted intent | solution boundaries and validation strategy are decided |
| Build | accepted design | implementation and local feedback are complete |
| Test | build candidate | independent evidence supports or rejects release |
| Deploy | release candidate | rollout is complete and post-deploy checks pass |
| Maintain | production signal or scheduled health work | service is stable and learning is routed |

A failed gate returns work to the earliest stage whose decision is invalid. Do not
force every failure back through all later stages.

## Human attention

Escalate only when the agent cannot resolve an ambiguity from authoritative
sources, a policy exception is needed, risk exceeds delegated authority, or an
external/production action requires an accountable approver. Routine synthesis,
mechanical checks, and low-risk corrections proceed without a meeting.

## Status report

Keep navigation compact:

```text
Stage: <stage>
Source: <canonical record>
Gate: <passed | failed | awaiting decision>
Next: <one action>
Human decision: <none | precise question and consequence>
```
