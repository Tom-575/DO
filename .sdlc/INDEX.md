# SDLC Index

This is the first-read navigation index for Agents and humans. It summarizes
current state and links to durable records. Detailed decisions and evidence stay
in their canonical artifacts.

## Current State

- Active changes: 1
- Lifecycle state: maintain
- Last updated: 2026-09-17
## Active Changes

- **ui-v2-redesign**: stage `maintain`, gate `deployed-stable`, risk `medium`
  工件：[plan](changes/ui-v2-redesign/plan.md) · [design](changes/ui-v2-redesign/design.md) · [build](changes/ui-v2-redesign/build.md) · [test](changes/ui-v2-redesign/test.md) · [deploy](changes/ui-v2-redesign/deploy.md) · [maintain](changes/ui-v2-redesign/maintain.md)
  **开放跟进**：真机（iOS / 安卓）走查未做；`maintain.md` 里的流程学习已落本文件 Recent Learnings。
## Active Decisions

No active decisions recorded.

## Active Constraints

- Six stages are mandatory: Plan, Design, Build, Test, Deploy, Maintain.
- Stage artifacts are version-controlled with the project.
- Human approval confirms factual accuracy and consequential decisions.
- Detailed records are read on demand; this index is the default entry point.

## Recent Learnings

- 2026-09-17 —— **「按新稿换一整套 UI」会与既往逐条已确认决策打架**：本轮三处（三选出口数量、分享卡封面是否裁切、分类来源）在设计稿里与 `CONTEXT.md`／`DESIGN.md` 相反。先实现、后确认是流程瑕疵；下次遇到同类应**先列冲突清单交人工裁决**。详见 [changes/ui-v2-redesign/maintain.md](changes/ui-v2-redesign/maintain.md)。


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
