# Build: V2 真机反馈 —— 第一步页返回卡死 / 今天-痕迹横滑手势失效 / 念头卡去示例 chip

status: accepted
source_intent: .sdlc/changes/v2-device-feedback/plan.md
source_design: .sdlc/changes/v2-device-feedback/design.md
issue:
pr:
revision:
owner: codebuddy-agent
created_at: 2026-09-19
updated_at: 2026-09-19

## 记录信息

| 项目 | 内容 |
|---|---|
| 变更编号 | v2-device-feedback |
| 阶段负责人 | tom57 |
| 来源类型 | bug + 体验收敛 |
| 来源引用 | 用户 2026-09-19 会话原文 |
| 上游记录 | plan.md / design.md |
| 代码版本 | 未提交工作树（HEAD = `192c8a4`） |
| PR | 无（本地原型仓库直接提交） |
| 当前状态 | candidate |
| 创建时间 | 2026-09-19 |
| 更新时间 | 2026-09-19 |

## Implementation summary

三处改动，全部落在 `prototypes/first-loop/src`：

1. **#42 第一步页返回**（`pages/ActionPage.tsx`）：返回按钮由
   `dispatch({ type: 'setScreen', screen: 'input', direction: 'back' })`
   改为 `onClick={leave}`（`useExpandTransition().leave`）。
   收回动画播完后走既有 `finalizeLeave`：`setIdea('')` + `setActiveDO(null)` + `goHome()`。
   清理口径与 `commit()` 后的完全一致，未新增状态分支。
2. **#43 分页手势**（`App.tsx`）：新增 `tabFromGesture` ref。`syncTabFromScroll` 判定要翻页时先置位；
   `tab → 分页位置` 的 effect **先消费**该标记（任何早退分支都不会留下残留），命中时只刷新
   `lastScrollLeft` 就返回，不设置 `guardedUntil`、不调用 `scrollTo`。点 Tab 的路径不置位，
   程序化平滑滚动与 600ms 守卫逻辑原样保留。
3. **#44 念头卡去示例 chip**（`pages/TodayPage.tsx` + `pages/today.css`）：删 `EXAMPLE_IDEAS`
   常量与 `.idea-chips` 整块 JSX；删 `.idea-chips` / `.idea-chips .chip` / `.idea-chips .chip.selected`
   三条规则。基础 `.chip` 保留——`RecordPage` 的 `.record-chip` 仍在用（`record.css` 另有覆盖）。

## Changed areas

| 文件 | 改动 |
|---|---|
| `src/App.tsx` | +2 行 ref 声明、effect 增来源分支（+10）、`syncTabFromScroll` 置位（+5） |
| `src/pages/ActionPage.tsx` | 返回按钮改 `leave`；`finalizeLeave` 注释补「返回与提交共用出口」 |
| `src/pages/TodayPage.tsx` | 删 `EXAMPLE_IDEAS`（3 行）与 `.idea-chips` 区块（7 行） |
| `src/pages/today.css` | 删 12 行（`.idea-chips` 三条规则） |
| `docs/design/DESIGN.md` | §2.1 念头卡与第一步页描述、§2.2 新增第 5 条返回语义、§5.0 新增「状态与位置谁在推进」 |
| `docs/TODO.md` | 新增六期 #42–#45 与「SDLC 流程修复」段标题 |

## Tests changed

本轮把验证脚本**入库**为 [scripts/verify.mjs](../../../prototypes/first-loop/scripts/verify.mjs)
（`npm run verify`）：headless Chrome + CDP 断言 16 条，自动复用或启动 dev server、跑完收摊，
只依赖 Node 22+ 自带的 `fetch` / `WebSocket`。
此前项目没有可重跑的验证入口——四期 / 五期的结论都只有「当时的 eval 表达式 + 截图」，
本轮补上这个缺口。截图刷新到 `.sdlc/evidence/v2-device-feedback/`。

## Material deviations

无。三处均按 `design.md` 的 Chosen approach 落地；`#45`（卡片改版）按 plan 的 Out of scope 未动。

## Local checks

| Check | Command | Result |
|---|---|---|
| 类型检查 | `npm run typecheck`（`tsc --noEmit`） | 通过，无输出 |
| 生产构建 | `npm run build`（`vite build`） | 通过；`dist/assets/index-DrdySpHj.js` (464.87 kB / gzip 143.40 kB)、`index-BaglvBSY.css` (30.73 kB) |
| 静态诊断 | IDE linter（App / ActionPage / TodayPage） | 0 条 |
| 桌面断言脚本 | `npm run verify`（cwd `prototypes/first-loop`） | 16/16 通过（脚本已入库，可重跑） |

## Known limitations

- **真触摸链路仍未覆盖**：本机 `agent-browser` 的可执行文件被应用控制策略拦截、`playwright-cli`
  未安装，`Input.synthesizeScrollGesture` 级别的合成手势也不等价于真实手指拖拽。
  #43 的修复在逻辑上关闭了「手势期间被程序化滚动打断」这条路径，但**最终判据是用户真机滑动**。
  桌面部分随时可用 `npm run verify` 重跑（本地 dev server 已起：`http://192.168.110.144:4173/DO/`，
  手机同 Wi-Fi 可直接打开做人工走查）。
- **AI 真实路径未走**：#42 的验证在无 AI key（mock）下落库，未验证带 key 时「返回不再产生请求」
  的端到端表现（代码层面返回路径已不经过 `InputPage`，无请求可言）。
- `#45` 卡片改版未实施（plan 已声明为待讨论）。
