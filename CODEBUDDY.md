# CODEBUDDY.md

> 本文件是 CodeBuddy 的会话入口。
> **工作区约定的权威来源是 `AGENTS.md`**——本文件存在时它不再自动注入，所以**开工第一件事是完整读一遍 `AGENTS.md`**，再读 `docs/CONTEXT.md`（已确认术语）与 `docs/design/DESIGN.md`（唯一设计规范）。

## 流程门禁（SDLC）

本项目用 `.sdlc/` 走 **Plan → Design → Build → Test → Deploy → Maintain** 六阶段。这是一道**门禁**，不是参考资料。

**开工前（缺一不可）**

1. 读 `.sdlc/INDEX.md` 与 `.sdlc/lifecycle.yaml`，确认已到达的 gate 与活跃 change。
2. 读 `.zcode/skills/ai-sdlc-navigator/SKILL.md`，**手动按其步骤执行**——CodeBuddy 不自动加载 `.zcode/skills/`。`.codebuddy/skills/` 下有两个薄封装可直接调用：`ai-sdlc-navigator`、`code-review`。
3. 在 `docs/TODO.md` 认领任务编号，不要凭印象开工。

**收工前**

- `.sdlc/changes/<change-id>/` 必须存在，且**当前阶段该有的工件非空**：验收表有行、证据链接有目标。
- 没有工件 = 这次变更**没完成**。不允许以「下次补」收尾。
- 提交信息带 change 名。

**豁免**

确有理由豁免时，在 `docs/TODO.md` 对应任务下写明**豁免理由 + 补录去向**。**指向尚未落地的东西不算去向**（事故复发记录见 TODO #20）。

## 每轮开工先读什么

`AGENTS.md`（完整）→ `.sdlc/INDEX.md` → `docs/TODO.md`（认领任务）→ `docs/design/DESIGN.md`（唯一设计规范）→ `docs/CONTEXT.md`（已确认决策，不要重复询问）。

## 已知的坑

- `Tools/` 被 `.gitignore` 忽略：`Tools/claude-sdlc/scripts/*.py` 换台机器可能不存在。脚本缺失时**手工维护** `.sdlc/lifecycle.yaml` 与 `.sdlc/INDEX.md`，并在报告里注明，不要因此跳过流程。
- `.zcode/skills/` 是 claude-sdlc 的约定目录，CodeBuddy 不扫描它。**看不到不等于没有**——手动读 SKILL.md 照做。
- 门禁那段同文出现在 `AGENTS.md`、`.codebuddy/rules/sdlc-gate/RULE.mdc` 与本文件。改一处必须同步三处，用首句「流程门禁（SDLC）」grep 即可校验。
