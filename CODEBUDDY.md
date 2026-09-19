# CODEBUDDY.md

> 本文件是 CodeBuddy 的会话入口。**工作区约定的权威来源是 `AGENTS.md`**——本文件只保留 CodeBuddy 特有的入口与坑，不复制项目约定，也不复制工具用法。

## 流程门禁（SDLC）——任何变更都不得绕过

本项目用 `.sdlc/` 走 **Plan → Design → Build → Test → Deploy → Maintain** 六阶段。这是一道**门禁**，不是参考资料。

<!-- gate-rules:start -->
**铁律（逐条强制）**

1. 开工前先读 `.sdlc/INDEX.md` 与 `.sdlc/lifecycle.yaml`，确认已达 gate 与活跃 change；再在 `docs/TODO.md` **认领任务编号**，不凭印象开工。
2. 任何变更都要在 `.sdlc/changes/<change-id>/` 留下**当前阶段该有的工件**；没有工件 = 这次变更**没完成**，不允许用「下次补」收尾。
3. 收工前：提交信息带 change 名；工件非空（验收表有行、证据链接有目标）。
4. 豁免：确有理由时，在 `docs/TODO.md` 对应任务下写**豁免理由 + 已落地的补录去向**；指向尚未落地的东西不算去向。

**工具怎么用**：gate 词表、状态推进命令、每阶段必需工件、装工具箱，全部在 `.sdlc/RUNBOOK.md`——本文不复述。
<!-- gate-rules:end -->

## 每轮开工先读什么

`AGENTS.md`（完整）→ `.sdlc/INDEX.md` → `docs/TODO.md`（认领任务）→ `docs/design/DESIGN.md`（唯一设计规范）→ `docs/CONTEXT.md`（已确认决策，不要重复询问）。

## CodeBuddy 特有入口

- 技能：`.codebuddy/skills/`（17 个薄封装，指向工具箱本体 `Tools/claude-sdlc/skills/`）。
- 门禁：`.codebuddy/rules/sdlc-gate/RULE.mdc`（alwaysApply，与 `AGENTS.md` / 本文件逐字同文）。

## 已知的坑

- `Tools/` 被 `.gitignore` 忽略：换机器先按 `.sdlc/RUNBOOK.md` 的「装工具箱三步」补上；脚本真的缺失时**手工维护** `.sdlc/lifecycle.yaml` 与 `.sdlc/INDEX.md`，并在报告里注明「脚本缺失，状态为手工维护」，**不要因此跳过流程**。
- `.zcode/` 已于 2026-09-19 删除（旧 IDE 留下的 skill 快照），skill 正文只在工具箱本体；见到旧文档引用它，按 `.sdlc/RUNBOOK.md` 处理。
