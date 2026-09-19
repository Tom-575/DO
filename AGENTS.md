# DO workspace

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

> 上面这段铁律与 `CODEBUDDY.md`、`.codebuddy/rules/sdlc-gate/RULE.mdc` **逐字同文**（用 `gate-rules` 标记比对，命令见 `.sdlc/RUNBOOK.md`）。改一处必须同步三处。
>
> 每轮会话结束前在 `.sdlc/DAILY.md` 追加一节（铁律见该文件；「待决策」为空 = 当日无需人工动作）。

**按运行时分流（工具入口）**

| 运行时 | 入口 |
|---|---|
| CodeBuddy（当前） | `.codebuddy/skills/`（17 个薄封装，指向 `Tools/claude-sdlc/skills/`）+ `.codebuddy/rules/sdlc-gate/RULE.mdc`（alwaysApply 门禁） |
| claude-sdlc / zcode / 其它 | 手动读 `Tools/claude-sdlc/skills/ai-sdlc-navigator/SKILL.md` 并照做 |

---

## 项目

- 产品定位：把模糊念头变成一个可以开始的最小行动，再让真实经历被轻松记录。
- 产品约定：手机优先、电脑可用；MVP 阶段数据仅存本机（用导出 JSON 备份）；不加后端服务、云同步、社交能力。
- 决策原则：开始优先、一步原则、真实优先、低压力；记录可以不关联 DO；「已记录」描述记录生命周期，不等于「已完成」。
- 修改产品行为前先读 `docs/intent.md`、`docs/CONTEXT.md`、`docs/PRD.md`，不要重复询问 `docs/CONTEXT.md` 中已确认的决策。

## 技术

- 原型 `prototypes/first-loop`：`npm run prototype` → <http://localhost:4173/DO/>（vite `base: '/DO/'`）。
- 形态（H5，2026-09-13 定）：TypeScript + React 19 + Vite + Motion + Phosphor 的纯前端单页；DO / 记录 / 图片存 IndexedDB（idb-keyval），设置与 AI key 存 localStorage；AI 走 `lib/ai` adapter 直连 OpenAI 兼容接口；部署 GitHub Pages。

## 文档地图

- `docs/design/DESIGN.md`：唯一设计规范（2026-09-17 V2 换代，含动效契约 §5）。
- `docs/TODO.md`：任务拆解（一期–五期 + SDLC 流程修复），多窗口认领以它为准。
- `docs/DO-PROMPT.md`：DO 的 AI 行为 prompt；`research/`：竞品与视觉参考。
- `UI/<时间戳>/`：设计稿原件（设计工具导出）。
- `CLAUDE_SDLC_TODO.md`：**SDLC 工具箱的长期优化台账**（工具本身的待办，不是产品需求）。
- 旧设计文档（DESIGN_DIRECTION / DESIGN_CONCEPT_V2 / DESIGN_GRILL / HANDOFF_RESTART）已于 2026-09-13 删除，不要引用。

## 仓库边界

- `Tools/`（含 claude-sdlc 工具箱本体）与 `node_modules/` 都被 `.gitignore` 忽略，不进版本控制；**换机器要先按 `.sdlc/RUNBOOK.md` 的「装工具箱三步」补上**，否则 skill 正文与状态脚本都不在。
