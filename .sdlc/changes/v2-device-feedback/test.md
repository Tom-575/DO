# Test: V2 真机反馈 —— 第一步页返回卡死 / 今天-痕迹横滑手势失效 / 念头卡去示例 chip

status: passed
candidate_revision: 未提交工作树（评审固定点 HEAD = 9803f28）
source_intent: .sdlc/changes/v2-device-feedback/plan.md
source_design: .sdlc/changes/v2-device-feedback/design.md
source_change: .sdlc/changes/v2-device-feedback/build.md
issue:
pr:
verifier: codebuddy-agent
created_at: 2026-09-19
updated_at: 2026-09-19

## 记录信息

| 项目 | 内容 |
|---|---|
| 变更编号 | v2-device-feedback |
| 阶段负责人 | tom57 |
| 被验证版本 | 未提交工作树（HEAD = `192c8a4`，`vite build` 产物 `index-DrdySpHj.js`） |
| 上游记录 | plan.md / design.md / build.md |
| 验证者 | codebuddy-agent（同一会话内实现后自验；**独立性与真机覆盖见 Residual risk**） |
| 当前状态 | passed |
| 创建时间 | 2026-09-19 |
| 更新时间 | 2026-09-19 |

## Acceptance criteria

| Criterion | Evidence | Result |
|---|---|---|
| 编辑态（正在进行卡 → 第一步页）点返回落到今天页，不重发请求 | CDP 断言 11–14 + [04-back-home.png](../../evidence/v2-device-feedback/04-back-home.png) | 通过 |
| 从对话页进入的第一步页点返回同样回今天页，念头不残留 | `idea` 断言为空 + 返回路径不经 `InputPage`（`input-seen = 0`） | 通过 |
| 手势驱动的 tab 变化不再介入滚动位置（不设守卫、不 `scrollTo`） | CDP 断言 4（`scrollTo` 调用数 = 0）与 C 组对照（点 Tab = 1） | 通过 |
| 今天页黑卡内不再出现示例 chip，输入框与胶囊不变 | CDP 断言 1–3 + [01-today-no-chips.png](../../evidence/v2-device-feedback/01-today-no-chips.png) | 通过 |
| `npm run typecheck` / `npm run build` 通过 | build.md「Local checks」 | 通过 |
| 真触摸部分明确标注待用户真机确认 | 本文档「Untested scope」 | 通过（已登记） |

## Required checks

| Check | Source or command | Result | Link |
|---|---|---|---|
| 类型检查 | `npm run typecheck`（cwd `prototypes/first-loop`） | 通过（无输出） | — |
| 生产构建 | `npm run build` | 通过（1.01s；`index-DrdySpHj.js` / `index-BaglvBSY.css`） | — |
| 静态诊断 | IDE linter（App / ActionPage / TodayPage） | 0 条 | — |
| 桌面断言脚本（16 条） | `npm run verify`（cwd `prototypes/first-loop`） | 16/16 通过 | [scripts/verify.mjs](../../../prototypes/first-loop/scripts/verify.mjs) |
| 首页（去 chip 后）视觉 | 430×932 dpr2 截图 | 通过 | [01-today-no-chips.png](../../evidence/v2-device-feedback/01-today-no-chips.png) |
| 横滑到痕迹页 | 同上 | 通过 | [02-swipe-traces.png](../../evidence/v2-device-feedback/02-swipe-traces.png) |
| 第一步页（编辑既有 DO） | 同上 | 通过 | [03-step-edit.png](../../evidence/v2-device-feedback/03-step-edit.png) |
| 返回后的今天页 | 同上 | 通过 | [04-back-home.png](../../evidence/v2-device-feedback/04-back-home.png) |

## Change-specific checks

**重跑方式（脚本已入库，不依赖一次性工具）：**

```bash
cd prototypes/first-loop
npm run verify          # 自动复用或启动 dev server；跑完自动收摊
```

脚本 [scripts/verify.mjs](../../../prototypes/first-loop/scripts/verify.mjs)：headless Chrome
（`--headless=new` + CDP `--remote-debugging-port`，非自动化框架）+
`Emulation.setDeviceMetricsOverride(430×932, dpr 2, mobile)` + `Page.navigate` / `Runtime.evaluate`；
DOM 交互一律用真实 `element.click()`（走 React 事件委托）；页面异常通过
`Runtime.exceptionThrown` 事件监听（不是读一个从不被填的变量）。
只依赖 Node 22+ 自带的 `fetch` / `WebSocket`，无第三方包。
**实测结果：16 / 16 通过**（截图同时刷新到证据目录）。

| # | 断言 | 期望 | 实测 | 结果 |
|---|---|---|---|---|
| 1 | 首页无 `.idea-chips` | false | `hasChips=false`，`hasInput/hasGo=true` | 通过 |
| 2 | 输入框与「帮我找到第一步」仍在 + 正在进行卡在 | true | 同左 | 通过 |
| 3 | `.tab-pager` 两页 + `scroll-snap-type` | 2 / `x mandatory` | `slides=2`，`snap=x mandatory` | 通过 |
| 4 | 手势来源 tab 变化不调用 `Element.prototype.scrollTo`（patched 计数器） | 0 | `scrollToCalls=0` | 通过 |
| 5 | 越过中点翻到痕迹（`inert` 翻转） | `[true,false]` | `[true,false]` | 通过 |
| 6 | 吸附落到整数页 | `scrollLeft === clientWidth` | `430 / 430` | 通过 |
| 7 | 指示胶囊落在痕迹槽 | 2 | `selected=2` | 通过 |
| 8 | 点 Tab 仍走程序化滚动 | 调用数增加 | `0 → 1` | 通过 |
| 9 | 点「今天」后回到第一页 | `scrollLeft=0`、`inert=[false,true]` | 同左 | 通过 |
| 10 | 点「正在进行」卡进入第一步页 | `.action-page` 存在 | `figure=10MIN`（口径已被 #48 改，见下节） | 通过 |
| 11 | 返回后无 `.push-layer` | false | `hasPushLayer=false` | 通过 |
| 12 | 返回过程中**从未**渲染 `.input-page`（MutationObserver 记录） | 0 | `inputPageSeen=0` | 通过 |
| 13 | 返回后念头已清空 | `''` | `idea=""` | 通过 |
| 14 | 返回不触发程序化滚动 | delta = 0 | `delta=0` | 通过 |
| 15 | 等待 1.2s 后仍停在今天页（未出现「返回 → 弹回」循环） | 无 push 层 | 同左 | 通过 |
| 16 | 页面无未捕获异常（`Runtime.exceptionThrown`） | 0 | 0 | 通过 |

**对照说明（断言的区分度）**：断言 4 与 12 在修改前必然失败——
旧代码里手势触发 `setTab` 后 effect 会调用 `scrollTo`（计数器 ≥ 1），
旧返回路径会渲染 `.input-page`（`inputPageSeen ≥ 1`）。

## 后续变更对本文件的影响（2026-09-20）

- **时长口径**：第一步页的档位随后由 change `v2-usage-refinement`（#48）改为 5 / 15 / 自定义，
  AI 建议的 10 分钟会**吸附到 15**，因此上表断言 10 的实测值现在是 `figure=15MIN`；
  脚本里的断言也相应放宽为 `/^\d+MIN$/`。功能未回退，只是显示口径变了。
## Code review（两轴，2026-09-20）

评审在 change `v2-usage-refinement` 收工时一并跑（固定点 `9803f28`），对象是**两个 change 叠加后的未提交工作区**，
所以结论按 change 分开陈述。方法与完整报告见
[changes/v2-usage-refinement/test.md](../v2-usage-refinement/test.md) 的「Code review」。

### Standards

**本 change 侧无硬违规**：它引入的 `App.tsx`（手势来源判定）与 `ActionPage.tsx`（返回改走 `leave()`）
没有被 §5 动效契约判出问题；当轮修掉的 4 处硬违规全部落在 `v2-usage-refinement` 新增的样式与动画上。

### Spec

| 发现 | 判定 | 处理 |
|---|---|---|
| 本文件断言 10 的期望值写 `figure=10MIN`，而档位改动后实际是 15 | 真问题（文档过期，会让后来人以为断言失效） | 已在上表加注 + 加「后续变更对本文件的影响」一节 |
| 「手势分支不设 `guardedUntil`」这条契约没有对应断言 | judgement | **未动**：`guardedUntil` 是组件内部 ref，DOM 不可观测；「手势不调用 `scrollTo`」已覆盖该契约的可观测后果 |

**剔除的误报**：0 条（子代理在两轴上对本 change 的判断经复核均成立）。

## Untested scope

- **真触摸串**（`pointerdown → move → up` 的真实手指拖拽与惯性）：本机无可用自动化浏览器
  （`agent-browser` 可执行文件被应用控制策略拦截、`playwright-cli` 未安装），
  CDP 侧只能验证「手势来源不再被程序化滚动打断」这条逻辑路径，**不能替代真机手指验证**。
- **iOS Safari / 安卓 Chrome**：`inert`、`scroll-snap-stop`、`overscroll-behavior` 的真机表现；
  以及若断言 4 修复后仍不跟手，需再评估 CSS `touch-action` 分层（见 design.md 的 Material alternatives）。
- **带 AI key 的真实请求路径**：本轮全部在无 key（mock）下落库。
- **`#45` 卡片改版**：未实施，等人工讨论（plan.md Open decisions）。
- 深色主题下的本次改动视觉、键盘可达性。

## Residual risk

1. **真机滑动仍是唯一判据**：#43 的根因结论（拖拽期间程序化滚动打断触摸滚动）来自代码路径与
   四期 `interaction-motion-h5/test.md` 的 Untested 记录，**未在真机上复现过原故障**。
   若用户真机滑动仍失效，本条需回炉——下一步方向已写进 design.md，不在本轮盲改。
2. **验证者 = 实现者**（同一会话），独立性弱于外部 verifier；断言脚本与截图可重跑，但结论由同一个人给出。
3. `#42` 的返回落点是一次**产品行为变更**（不再回对话页）：已写进 `DESIGN.md §2.1/§2.2`，
   若用户希望保留「回上一步改措辞」，需要推翻 plan.md 的 Open decision 并另开 change。

## Verdict

`pass`

**放行范围**：桌面 Chromium 模拟 H5 视口（430×932）下的 `#42` / `#43` / `#44` 全部可验证行为，
以及 `typecheck` / `build`。每一项都有可重跑的断言或截图证据。

**放行后的必做项（阻塞「稳定」）**：用户在 iOS Safari 与安卓 Chrome 上确认
① 编辑态返回一次到位、② 今天 ↔ 痕迹手指能滑且越过中点指示跟手；不通过则按 Residual risk 1 回炉。
