---
name: ai-sdlc-deploy
description: Release an independently verified candidate through controlled rollout and post-deploy validation for the Deploy stage of an AI-native SDLC.
---

# Deploy

Start from a passing Test verdict or an explicitly approved exception. Read the Deploy contract in [`../../shared/artifact-contracts.md`](../../shared/artifact-contracts.md) and the applicable tier in [`../../shared/risk-model.md`](../../shared/risk-model.md).

1. Confirm the exact candidate, evidence, target environment, owner, migration, rollout, rollback, and post-deploy signal. Done when release and recovery are executable rather than aspirational.
2. Prepare the PR or release candidate and resolve mechanical pipeline failures within scope. Keep credentials short-lived and permissions limited to the approved action.
3. Obtain the approval required by repository and risk policy immediately before the external or production action. Skills do not substitute for branch protection, permissions, or accountable production approval.
4. Execute only the authorized rollout, observe post-deploy checks, and record the deployed revision and outcome. On failure, use the approved recovery path and hand the resulting signal to Maintain.

Deploy completes only when the target is stable and the release record is durable.

Optional primitives: use the repository's CI/CD integration for candidate and
deployment checks. The lifecycle Skill records the decision and outcome but does
not replace deployment permissions or production controls.
