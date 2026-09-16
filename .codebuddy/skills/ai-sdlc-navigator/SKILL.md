---
name: ai-sdlc-navigator
description: 在 DO 项目里推进任何一次软件变更时使用——把变更按 Plan / Design / Build / Test / Deploy / Maintain 六阶段走完并留下 .sdlc 工件。用户要求开工新任务、修 bug、改交互、加功能、改文档规范，或问「下一步该做什么」「流程走到哪了」「有没有走 SDLC」「有没有 code review」时，先加载本技能再动手。也用于查询当前 gate、活跃 change 与待人工决策项。
disable: false
---

# SDLC Navigator（DO 项目的运行时入口）

本技能是 `.zcode/skills/ai-sdlc-navigator/SKILL.md` 的**薄封装**：本项目原生的 SDLC 技能装在 `.zcode/skills/`（claude-sdlc 约定），**当前运行时不会自动加载那个目录**，所以入口放在这里。**权威定义永远是 `.zcode/skills/` 下的源文件，本文件只是导航。** 逐字照做前请打开源文件。

## 第一步：读状态与权威文件

1. `.sdlc/INDEX.md` —— 当前状态、Active Constraints、Recent Learnings、入口链接
2. `.sdlc/lifecycle.yaml` —— `active_changes`
3. `.zcode/skills/ai-sdlc-navigator/SKILL.md` —— 完整流程（Navigate 四步）
4. `.zcode/shared/` 下按需：`lifecycle.md`（阶段跃迁与 gate）、`risk-model.md`（复杂度深度）、`evidence-policy.md`（证据要求）、`artifact-contracts.md`（工件字段）

## 第二步：按状态加载对应阶段技能

| 当前状态 | 加载 |
|---|---|
| intent 不清或未被接受 | `.zcode/skills/ai-sdlc-plan/SKILL.md` |
| 有 intent、无已接受方案 | `.zcode/skills/ai-sdlc-design/SKILL.md` |
| 有方案、无构建候选 | `.zcode/skills/ai-sdlc-build/SKILL.md` |
| 有构建候选、无独立判定 | `.zcode/skills/ai-sdlc-test/SKILL.md` |
| 已判定、未发布 | `.zcode/skills/ai-sdlc-deploy/SKILL.md` |
| 线上信号 / 恢复 / 沉淀学习 | `.zcode/skills/ai-sdlc-maintain/SKILL.md` |

新增 change 的工件从 `.sdlc/templates/<stage>.md` 复制（plan / design / build / test / deploy / maintain 六个模板都在 `Tools/claude-sdlc/` 之外的 `.sdlc/templates/`）。

## 第三步：状态推进

```
python Tools/claude-sdlc/scripts/inspect_sdlc_state.py .
python Tools/claude-sdlc/scripts/update_sdlc_state.py start <change-id>
python Tools/claude-sdlc/scripts/update_sdlc_state.py advance <change-id>
python Tools/claude-sdlc/scripts/update_sdlc_state.py set-gate <change-id> --gate <gate>
```

人工确认 gate 之后才写 gate 状态——**对话里的口头确认不算状态变更**。

⚠️ **`Tools/` 被 `.gitignore` 忽略**：换一台机器这些脚本可能不存在。脚本缺失时**不要跳过流程**——改为手工维护 `.sdlc/lifecycle.yaml` 与 `.sdlc/INDEX.md`，并在报告里注明「脚本缺失，状态为手工维护」。

## 第四步：报告格式（照源文件）

```
Stage: <stage>
Source: <canonical record>
Gate: <passed | failed | awaiting decision>
Next: <one action>
Human decision: <none | 精确问题与后果>
```

不要复述工件内容；只报阶段、来源、gate、下一步、以及需要的那**一个**人工决定。
