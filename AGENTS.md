# DO workspace

- 产品定位：把模糊念头变成一个可以开始的最小行动，再让真实经历被轻松记录。
- 当前权威文档：`docs/intent.md` 管长期价值；`docs/CONTEXT.md` 管已确认术语与决策；`docs/PRD.md` 管当前产品范围。
- 当前原型：`prototypes/first-loop`，运行 `npm run prototype`，访问 `http://localhost:4173/`。
- 技术形态：React + Vite + Motion 的 H5 原型；这是可丢弃原型，不是生产架构。
- 原型约定：保持手机优先、电脑可用；状态仅驻留内存，刷新即失；不添加账号、数据库或真实发布。
- 决策原则：开始优先、一步原则、真实优先、低压力；记录可以不关联 DO；“已记录”描述记录生命周期，不等于“已完成”。
- 修改产品行为前先读 `docs/intent.md`、`docs/CONTEXT.md`、`docs/PRD.md`，不要重复询问 `docs/CONTEXT.md` 中已确认的决策。
- 下一步：验证从模糊念头到记录保存的完整闭环，再据反馈形成正式规格。
- 流程管理：本项目用 claude-sdlc 走 Plan → Design → Build → Test → Deploy → Maintain 六阶段。任何变更开始前先读 `.sdlc/INDEX.md`；用 `python Tools/claude-sdlc/scripts/update_sdlc_state.py` 创建与推进 change（`start` / `advance` / `archive`）。17 个 skill 已装入 `.zcode/skills/`，入口是 `ai-sdlc-navigator`。
- 文档地图：`docs/design/DESIGN.md` 是唯一设计规范（基于当前原型的 as-built 基线，含已知问题与下阶段设计任务）；`docs/TODO.md` 是 H5 开发任务拆解（工作流 W0–W4，多窗口认领以此为准）；`docs/DO-PROMPT.md` 是 DO 的 AI 行为 Prompt；`research/` 是竞品与视觉参考。旧设计文档（DESIGN_DIRECTION、DESIGN_CONCEPT_V2、DESIGN_GRILL、HANDOFF_RESTART）已于 2026-09-13 删除，不要引用。
- 仓库边界：`Tools/` 是本地第三方工具（含 claude-sdlc 本体），`node_modules/` 是依赖，两者都不进版本控制。
