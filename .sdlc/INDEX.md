# SDLC Index

This is the first-read navigation index for Agents and humans. It summarizes
current state and links to durable records. Detailed decisions and evidence stay
in their canonical artifacts.

## Current State

- Active changes: 3
- Lifecycle state: deploy
- Last updated: 2026-09-13
## Active Changes

- **mvp-record-loop-h5**: stage `deploy`, gate `awaiting-human-review`, risk `medium`
- **action-page-three-choices**: stage `deploy`, gate `awaiting-human-review`, risk `low`
- **record-image-upload-fix**: stage `deploy`, gate `awaiting-human-review`, risk `low`
## Active Decisions

No active decisions recorded.

## Active Constraints

- Six stages are mandatory: Plan, Design, Build, Test, Deploy, Maintain.
- Stage artifacts are version-controlled with the project.
- Human approval confirms factual accuracy and consequential decisions.
- Detailed records are read on demand; this index is the default entry point.

## Recent Learnings

No learnings recorded.

## Entry Points

- Machine state: [lifecycle.yaml](lifecycle.yaml)
- Artifact contracts: [../shared/artifact-contracts.md](../.zcode/shared/artifact-contracts.md)
- Risk model: [../shared/risk-model.md](../.zcode/shared/risk-model.md)
- Evidence policy: [../shared/evidence-policy.md](../.zcode/shared/evidence-policy.md)
- Lifecycle protocol: [../shared/lifecycle.md](../.zcode/shared/lifecycle.md)

## Reading Policy

Read this index and the current change before searching historical artifacts. Open
decisions, evidence, releases, or learnings only when the current task needs them.
Use Git history when the reason for a superseded decision matters.
