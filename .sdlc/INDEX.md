# SDLC Index

This is the first-read navigation index for Agents and humans. It summarizes
current state and links to durable records. Detailed decisions and evidence stay
in their canonical artifacts.

## Current State

- Active changes: 1
- Lifecycle state: deploy
- Last updated: 2026-09-16
## Active Changes

- **interaction-motion-h5**: stage `deploy`, gate `awaiting-human-review`, risk `low`
## Active Decisions

No active decisions recorded.

## Active Constraints

- Six stages are mandatory: Plan, Design, Build, Test, Deploy, Maintain.
- Stage artifacts are version-controlled with the project.
- Human approval confirms factual accuracy and consequential decisions.
- Detailed records are read on demand; this index is the default entry point.

## Recent Learnings

- 2026-09-16 —— **SDLC 入口装在了"某个运行时看得见、另一个看不见"的目录**，是「流程不自动触发」的机械主因（本项目技能在 `.zcode/skills/`，CodeBuddy 只扫 `.codebuddy/skills/`）。门禁必须落在**总是生效的规则** + **运行时会话语义入口**上，并给每个运行时写 fallback（扫不到就手动读 SKILL.md）。详见 [changes/interaction-motion-h5/maintain.md](changes/interaction-motion-h5/maintain.md)。
- 2026-09-16 —— **两个工具缺陷（待修）**：① `validate_sdlc_state.py` 硬要求 `<项目根>/shared/*.md`，而本项目装在 `.zcode/shared/` ⇒ 校验恒红；② `inspect_sdlc_state.py` 与 `update_sdlc_state.py` 的工件字段名不是一套（`intent` vs `plan`）⇒ **任何活跃 change 都被误判 `Missing: intent`**，而它正是 navigator 的第一步。详见同一工件。

## Entry Points

- Runtime entry (CodeBuddy): [../CODEBUDDY.md](../CODEBUDDY.md) · [../.codebuddy/rules/sdlc-gate/RULE.mdc](../.codebuddy/rules/sdlc-gate/RULE.mdc) · [../.codebuddy/skills/ai-sdlc-navigator/SKILL.md](../.codebuddy/skills/ai-sdlc-navigator/SKILL.md)
- Machine state: [lifecycle.yaml](lifecycle.yaml)
- Artifact contracts: [../shared/artifact-contracts.md](../.zcode/shared/artifact-contracts.md)
- Risk model: [../shared/risk-model.md](../.zcode/shared/risk-model.md)
- Evidence policy: [../shared/evidence-policy.md](../.zcode/shared/evidence-policy.md)
- Lifecycle protocol: [../shared/lifecycle.md](../.zcode/shared/lifecycle.md)

## Reading Policy

Read this index and the current change before searching historical artifacts. Open
decisions, evidence, releases, or learnings only when the current task needs them.
Use Git history when the reason for a superseded decision matters.
