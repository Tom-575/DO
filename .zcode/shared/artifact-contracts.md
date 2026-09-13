# Artifact Contracts

Artifacts preserve decisions across stage boundaries. Prefer the project's issue
tracker, PR, tests, commits, and operational systems as canonical records. Create a
new Markdown file only when no existing record can carry the information durably.

## Plan

- problem and affected users
- desired outcome and success criteria
- scope, exclusions, and constraints
- unresolved decisions, owner, and risk tier

## Design

- chosen approach and affected boundaries
- behavior, data, and interface contracts
- material alternatives and policy conflicts
- validation strategy and rollout implications

## Build

- implementation or linked diff
- tests added or changed
- material deviations from design
- local check results and unfinished work

## Test

- each success criterion mapped to observed evidence
- required commands/checks and their results
- independent review findings
- untested scope, residual risk, and verdict

## Deploy

- approved candidate and evidence link
- migration, rollout, rollback, and owner
- production approval where required
- deployment result and post-deploy checks

## Maintain

- signal, impact, diagnosis, recovery, and cause
- preventive asset created
- new intent when further product work is needed

Write only decision-bearing facts. Link rather than restate source material.

## Language and metadata policy

Artifact filenames and machine-readable keys remain stable English identifiers.
Titles, explanations, decisions, evidence, and review notes may be written in
Chinese or English. Keep provenance in the record-information table and keep
gate approval in `lifecycle.yaml`; do not duplicate approval fields in every
artifact.
