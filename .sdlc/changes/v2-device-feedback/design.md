# Design: V2 真机反馈 —— 第一步页返回卡死 / 今天-痕迹横滑手势失效 / 念头卡去示例 chip

status: accepted
owner: codebuddy-agent
source_intent: .sdlc/changes/v2-device-feedback/plan.md
issue:
pr:
supersedes:
created_at: 2026-09-19
updated_at: 2026-09-19

## 记录信息

| 项目 | 内容 |
|---|---|
| 变更编号 | v2-device-feedback |
| 阶段负责人 | tom57 |
| 来源类型 | bug + 体验收敛 |
| 来源引用 | 用户 2026-09-19 会话原文 |
| 上游记录 | plan.md |
| 当前状态 | accepted |
| 创建时间 | 2026-09-19 |
| 更新时间 | 2026-09-19 |

## Chosen approach

### #42 第一步页返回：改走 `leave()` 收回首页

现状（`src/pages/ActionPage.tsx`）：

```tsx
left={<button className="icon-action" onClick={() => dispatch({ type: 'setScreen', screen: 'input', direction: 'back' })} …>}
```

这条路径有两个缺陷叠加：

1. **状态机成环**：`screen` 回到 `input` 后 `InputPage` 重新挂载，其 seed effect
   （`if (seeded.current || !idea.trim()) return`）把首页念头**再发一次**给 AI；行动落定后
   `setScreen('action')` 把用户推回第一步页 —— 「返回 → 弹回」。带 key 的真机上每次还要夹一次
   网络往返，观感即「卡」。
2. **违反动效契约**：`DESIGN §5.1` 要求 push 屏返回必须按相反曲线收回；直接 `setScreen`
   等于硬跳，`useExpandTransition` 的 `bloom-out` 从不播放。

选定方案：返回按钮改为调用 `expand.leave`（与 `InputPage` 一致），收回到原点后由
`finalizeLeave` 收尾 —— `setIdea('')` + `setActiveDO(null)` + `goHome()`。
`finalizeLeave` 保持既有清理口径（与 `commit()` 后的清理完全一致），不新增分支。

### #43 分页手势：给 tab 变化加「来源」

现状（`src/App.tsx`）是一条双向回路：

- 手势/程序化滚动 → `syncTabFromScroll` 越过中点 → `setTab` → **状态**跟手；
- `setTab` → effect → `scrollTo({ behavior: 'smooth' })` → **位置**跟上。

回路的第二段在**手势正驱动滚动**时是错的：触摸拖拽期间对该容器调用程序化滚动会打断/取消
原生触摸滚动，于是「滑一下就弹回」。四期之所以在桌面模拟下判通过，是因为断言用的是
`scrollLeft = 430` 直接赋值，绕过了真实拖拽。

选定方案：**谁发起谁负责**。新增一个 ref 标记这次 tab 变化是否由手势引起；effect 读到手势来源时
只做状态侧的对账（刷新 `lastScrollLeft`），**不**触碰滚动位置、不设置程序化守卫。

```tsx
/** 本次 tab 变化是否由手势（拖拽 / 惯性）驱动；是则 effect 只对账、不介入滚动位置 */
const tabFromGesture = useRef(false);

useEffect(() => {
  const fromGesture = tabFromGesture.current;
  tabFromGesture.current = false;      // 先消费，避免任何早退分支把标记留到下一次
  const pager = pagerRef.current;
  if (!pager) return;
  const firstForThisNode = positionedNode.current !== pager;
  positionedNode.current = pager;
  pageWidthRef.current = pager.clientWidth;
  if (fromGesture) {                    // 手势已经在推进位置：状态跟上就够了
    lastScrollLeft.current = pager.scrollLeft;
    return;
  }
  …既有 scrollTo 逻辑不动…
}, [tabIndex, reduceMotion]);

const syncTabFromScroll = () => {
  …
  if (nextTab !== tabRef.current) {
    tabFromGesture.current = true;      // 打上来源，交给上面的 effect 消费
    dispatch({ type: 'setTab', tab: nextTab });
  }
};
```

点 Tab 的路径不设标记：状态先动，位置由程序化平滑滚动跟上，`PROGRAMMATIC_GUARD_MS` 守卫逻辑
与「越过中点立刻翻」（#26 定的跟手手感）都原样保留。

### #44 念头卡去示例 chip

`TodayPage` 删掉 `EXAMPLE_IDEAS` 常量与 `.idea-chips` 整块 JSX；`today.css` 删掉 `.idea-chips`
相关三条规则（`.idea-chips` / `.idea-chips .chip` / `.idea-chips .chip.selected`）。
`.chip` 基础样式可能仍被别处使用，删除前先确认无其他引用。

## Affected boundaries

| 位置 | 变化 |
|---|---|
| `src/App.tsx` | 分页 effect 增加「来源」判定（#43） |
| `src/pages/ActionPage.tsx` | 返回按钮改走 `leave()`（#42） |
| `src/pages/TodayPage.tsx` | 删示例 chip（#44） |
| `src/pages/today.css` | 删 `.idea-chips` 规则（#44） |
| `docs/design/DESIGN.md` | §3 念头卡描述、§5 行动页返回语义（本文档同轮回写） |
| 存储 / AI 契约 | **无变化**（无 schema、无 adapter、无 prompt 改动） |

## Behavior contract

1. **第一步页返回**：点左上返回 → 播放收回到来源控件的动画（无原点 / reduce-motion 时直接返回）
   → 落到今天页；`idea` 清空、`activeDOId` 置 null；**不发起任何 AI 请求**。
   与 `commit()` 后的清理口径一致，两者只有「有没有写 DO」的差别。
2. **分页 tab 状态**：手势越过中点仍立刻翻（指示胶囊跟手，行为不变）；但此时**不调用 `scrollTo`**、
   不设置 `guardedUntil`。
3. **点 Tab**：状态先动，`scrollTo({ behavior: 'smooth' })` 跟到整数页，守卫窗口内忽略落点判定 —— 不变。
4. **念头卡**：只有 kicker + 输入框（`growTextarea` 自适应）+ 蜜桃胶囊「帮我找到第一步」；
   输入为空时胶囊不置灰、点击把光标送回输入框 —— 不变。

## Data and interface changes

无。`EXAMPLE_IDEAS` 是页内常量（非数据契约）；`docs/TODO.md` 文末契约表无需修改。

## Validation strategy

- `npm run typecheck`、`npm run build` 必过。
- 桌面 Chromium 模拟视口（430×932）断言：
  1. 编辑态点返回后 `screen === 'home'`，且 `idea === ''`、无 `.push-layer`；
  2. 手势驱动 tab 变化时 `.tab-pager` 的 `scrollLeft` **不被程序化改写**
     （对比：点 Tab 时 `guardedUntil` 生效、位置平滑到整数页）；
  3. 今天页 DOM 中不存在 `.idea-chips`，输入框与胶囊仍在；
  4. 控制台无错误。
- **真触摸部分（拖拽 / 惯性）本环境无法覆盖**：`agent-browser` 在本机被应用控制策略拦截、
  `playwright-cli` 未安装 —— 与四期同样的限制。此项**明确交给用户真机确认**，写进 Residual risk，
  不允许用桌面断言冒充通过。

## Rollout implications

- 仍在 `prototypes/first-loop` 内，随 GitHub Pages 走既有自动部署；无数据迁移、无兼容问题。
- 若用户真机确认手势仍不跟手，下一步才考虑 CSS 层 `touch-action` 分层（见 Material alternatives）。

## Policy conflicts and exceptions

- `DESIGN §5.1`「返回按相反曲线收回」：本次 #42 是把违反契约的实现**改回契约**，无冲突。
- `docs/TODO.md` 六期 #45（卡片改版）已声明「先讨论后动手」，本轮不动 `card-render.ts`，无越界。

## Material alternatives

| 方案 | 结论 |
|---|---|
| #42 备选：保留「返回对话页」，只给 `InputPage` 加「已有 plannedAction 就不重发」守卫 | 否。返回对话页本身无意义（已发出的念头不可编辑），而且用户要的是「能回去」，回首页路径更短 |
| #42 备选：返回直接 `dispatch({ type: 'goHome' })` | 否。硬跳屏幕违反 §5.1，且会跳过收回动画 |
| #43 备选：删掉「越过中点立刻翻」，等停稳再同步 tab | 否。#26 已判定这种做法「与手指脱钩，被读成页面重新刷新」 |
| #43 备选：CSS `touch-action` 分层（`.tab-pager` pan-x / `.app-scroll` pan-y） | 本轮不动。命中链上 `touch-action` 取交集，写错会让整页纵向也滚不动；且当前根因已在 JS 回路里成立，先修确定性更高的那一处 |
| #44 备选：chip 减到 1 个 | 否。用户要求「去掉推荐选项」，保留一个仍是推荐 |
