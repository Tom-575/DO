# DO workspace

## 流程门禁（SDLC）——任何变更都不得绕过

本项目用 `.sdlc/` 走 **Plan → Design → Build → Test → Deploy → Maintain** 六阶段。这是一道**门禁**，不是参考资料。

**开工前（缺一不可）**

1. 读 `.sdlc/INDEX.md` 与 `.sdlc/lifecycle.yaml`，确认已到达的 gate 与活跃 change。
2. 读 `.zcode/skills/ai-sdlc-navigator/SKILL.md`，**手动按其步骤执行**。`AGENTS.md` 只是约定，**没有可执行入口**：技能在 `.zcode/skills/`，运行时不一定扫得到。
3. 在 `docs/TODO.md` 认领任务编号，不要凭印象开工。

**收工前**

- `.sdlc/changes/<change-id>/` 必须存在，且**当前阶段该有的工件非空**：验收表有行、证据链接有目标。
- 没有工件 = 这次变更**没完成**。不允许以「下次补」收尾。
- 提交信息带 change 名。

**豁免**

确有理由豁免时，在 `docs/TODO.md` 对应任务下写明**豁免理由 + 补录去向**。**指向尚未落地的东西不算去向**（事故复发记录见 TODO #20）。

**按运行时分流**

| 运行时 | 入口 |
|---|---|
| claude-sdlc / zcode | `.zcode/skills/`，入口 `ai-sdlc-navigator`（原生） |
| CodeBuddy | `.codebuddy/skills/ai-sdlc-navigator`、`.codebuddy/skills/code-review`（薄封装，指向 `.zcode/` 源文件）；门禁由 `.codebuddy/rules/sdlc-gate/RULE.mdc`（alwaysApply）与 `CODEBUDDY.md` 保证 |
| 其它 agent | 手动读 `.zcode/skills/ai-sdlc-navigator/SKILL.md` 并照做 |

> 本段同文出现在 `CODEBUDDY.md` 与 `.codebuddy/rules/sdlc-gate/RULE.mdc`。改一处必须同步三处——用门禁首句「流程门禁（SDLC）」grep 即可校验。

---

- 产品定位：把模糊念头变成一个可以开始的最小行动，再让真实经历被轻松记录。
- 当前权威文档：`docs/intent.md` 管长期价值；`docs/CONTEXT.md` 管已确认术语与决策；`docs/PRD.md` 管当前产品范围。
- 当前原型：`prototypes/first-loop`，运行 `npm run prototype`，访问 `http://localhost:4173/`。
- 技术形态（H5 版，2026-09-13 已定）：TypeScript + React 19 + Vite + Motion + Phosphor 的纯前端单页应用；无后端、无账号、无服务器数据库；DO/记录/图片存 IndexedDB（idb-keyval），设置与 AI key 存 localStorage；AI 通过统一 adapter 走 OpenAI 兼容接口直连；部署 GitHub Pages。
- 产品约定：保持手机优先、电脑可用；MVP 阶段数据仅存本机，用导出 JSON 做备份；不添加后端服务、云同步、社交能力。
- 决策原则：开始优先、一步原则、真实优先、低压力；记录可以不关联 DO；“已记录”描述记录生命周期，不等于“已完成”。
- 修改产品行为前先读 `docs/intent.md`、`docs/CONTEXT.md`、`docs/PRD.md`，不要重复询问 `docs/CONTEXT.md` 中已确认的决策。
- 下一步：验证从模糊念头到记录保存的完整闭环，再据反馈形成正式规格。
- 流程管理：六阶段门禁见本文档开头的「流程门禁（SDLC）」。状态推进脚本是 `python Tools/claude-sdlc/scripts/update_sdlc_state.py`（`start` / `advance` / `set-gate` / `archive`）。**17 个 skill 装在 `.zcode/skills/`，入口是 `ai-sdlc-navigator`——但 `.zcode/` 是 claude-sdlc 的约定目录，不同运行时不一定扫得到；扫不到时手动读 `SKILL.md` 照做（CodeBuddy 见 `.codebuddy/skills/`）。** 另注意 `Tools/` 被 `.gitignore` 忽略，脚本在新机器上可能不存在，缺失时手工维护 `.sdlc/lifecycle.yaml` 与 `.sdlc/INDEX.md`。
- 文档地图：`docs/design/DESIGN.md` 是唯一设计规范（基于当前原型的 as-built 基线，含已知问题与下阶段设计任务）；`docs/TODO.md` 是 H5 开发任务拆解（工作流 W0–W4，多窗口认领以此为准）；`docs/DO-PROMPT.md` 是 DO 的 AI 行为 Prompt；`research/` 是竞品与视觉参考。旧设计文档（DESIGN_DIRECTION、DESIGN_CONCEPT_V2、DESIGN_GRILL、HANDOFF_RESTART）已于 2026-09-13 删除，不要引用。
- 仓库边界：`Tools/` 是本地第三方工具（含 claude-sdlc 本体），`node_modules/` 是依赖，两者都不进版本控制。
