# Design: V2 使用细化 —— 入口改「DO」且无 AI 直跳 / 关联念头提升 / 时长档位 5-15-自定义

status: accepted
owner: codebuddy-agent
source_intent: .sdlc/changes/v2-usage-refinement/plan.md
issue:
pr:
supersedes:
created_at: 2026-09-20
updated_at: 2026-09-20

## 记录信息

| 项目 | 内容 |
|---|---|
| 变更编号 | v2-usage-refinement |
| 阶段负责人 | tom57 |
| 来源类型 | 体验细化 |
| 来源引用 | 用户 2026-09-20 会话 |
| 上游记录 | plan.md |
| 当前状态 | accepted |
| 创建时间 | 2026-09-20 |
| 更新时间 | 2026-09-20 |

## Chosen approach

### #46 入口叫「DO」，没配 AI 就跳过对话

`TodayPage` 的 `goPlan` 现在是无条件 `setScreen('input')`。改成按配置分流：

```tsx
const goPlan = (event: MouseEvent<HTMLButtonElement>) => {
  captureExpandOrigin(event.currentTarget);      // 原点仍取自这颗按钮：新屏幕从这里长出
  dispatch({ type: 'setActiveDO', id: null });
  // 没配 AI 时对话页只会跑 mock 的关键词提问（"想在哪儿动一动？"），价值低、多一步；
  // 直接进第一步页，行动仍由 lib/mock 的关键词模板生成（本轮不换生成逻辑）
  dispatch({ type: 'setScreen', screen: isAIConfigured(settings) ? 'input' : 'action' });
};
```

判据 `isAIConfigured`（`baseURL + model + apiKey` 三者齐全）**复用 `lib/ai.ts` 已有的导出版本**，
不新写一套判断——否则设置页与入口会各自漂移。

按钮文案 `帮我找到第一步` → `DO`，保留右箭头；`aria-label` 补回完整语义
（「交给 DO，找到第一步」），因为屏读器读不出一个孤零零的「DO」。

### #47 关联入口从工具行挪出来

`.record-chips` 里现在塞了四颗同款 chip。把关联那颗删掉，改成工具行**下面**的独立一行：

```tsx
<button className={`record-link${selected ? ' linked' : ''}`} aria-expanded={pickerOpen}
        onClick={() => setPickerOpen((open) => !open)}>
  <LinkIcon size={15} />
  <span>{selected ? selected.thought : '关联一个念头'}</span>
  <CaretRight size={14} />
</button>
```

- 未关联：图标与文字都走 secondary，右侧箭头提示可进；一眼能看见"这里还能关联"。
- 已关联：念头原文走正文色、图标走陶土色，箭头换成下拉语义（`aria-expanded`），
  和工具行那三颗 12px chip 完全分层。
- **候选列表 `.record-picker` 随入口一起上移**（原挂在页面最底部）：换的是入口的层级，不是选择器本身——
  候选行与「不关联」的行为一字未动。为什么不留在底部：入口上移后点开还要往下滚，等于把「显眼」做成了「更难用」。
  （这处与本文初版的「一字不动」不同，偏差与理由记在 build.md 的 Material deviations。）

### #48 时长档位 5 / 15 / 自定义

`lib/duration.ts` 收口：

| 导出 | 变化 |
|---|---|
| `DURATION_OPTIONS` | `[10, 30, 60]` → `[5, 15]`（第三个是自定义，不进常量） |
| `DEFAULT_MINUTES` | 10 → 5 |
| `CUSTOM_MINUTES_MIN` / `MAX` | 新增：1 / 90 |
| `snapToOption(minutes)` | 新增：把 AI 解析出的分钟数**吸附到最近档位**（距离相同时取大 → 10 落到 15） |
| `clampCustomMinutes(value)` | 新增：四舍五入并夹到 1–90 |
| `durationLabel(minutes)` | 恒写「大约 N 分钟」（不再出现「大约 1 小时」与 `60 MIN` 打架） |
| `durationUnit` / `durationFigure` | **删除**：单位恒为 `MIN`，两个函数退化成恒等映射，留着只会让下一个读代码的人以为还有 HR 分支 |

`ActionPage` 的三处初值（`activeDO` 分支、`runGenerate` 成功、`catch` 兜底）统一走
`snapToOption(parseMinutes(...))`；**AI 的分钟数只决定"初始选中哪一档"，从不作为显示值出现**——
所以"大字写着 10、两颗胶囊都不亮"这个状态在结构上不可能发生。

交互：档位行保持三列 grid（5 / 15 / 自定义）；点「自定义」在档位行下方就地展开
`number` 输入 + 确定/取消，确定后写回 `minutes` 并收起。已设过自定义值时，该档显示
`<数字> 分钟` 并高亮（例如 `25 分钟`），否则显示「自定义」。
`type="number"` + `inputMode="numeric"` 让手机弹数字键盘；上限 90 保证大字不出现半格单位。

## Affected boundaries

| 位置 | 变化 |
|---|---|
| `src/lib/duration.ts` | 档位常量、吸附、自定义夹取；删 `durationUnit` / `durationFigure` |
| `src/pages/ActionPage.tsx` | 初值走 `snapToOption`；三档渲染 + 自定义展开；大字单位恒 `MIN` |
| `src/pages/action.css` | 自定义按钮与展开行样式 |
| `src/pages/TodayPage.tsx` | `goPlan` 按 `isAIConfigured` 分流；按钮文案 |
| `src/pages/RecordPage.tsx` | 关联入口移出 `.record-chips`，独立成行 |
| `src/pages/record.css` | `.record-link` 样式 |
| `scripts/verify.mjs` | 第一步页时长的断言随档位更新 |
| 存储 / AI 契约 | **无变化** |

## Behavior contract

1. **首页入口**：按钮显示「DO」。`isAIConfigured` 为真 → 进对话页；为假 → 直接进第一步页，
   全程不渲染对话页。两种情况下原点都取自这颗按钮（容器变换）。
2. **没配 AI 时的第一步页**：行动来自 `getAction` 关键词模板；时长档位与配了 AI 时**完全一致**。
3. **时长**：任何时候恰有一个档位处于选中态。选项 = 5 / 15 / 自定义；
   自定义值 ∈ [1, 90]，超出被夹取；单位恒为 `MIN`。
4. **AI 建议时长**：只决定初始选中项（吸附到最近档位，平局取大）；不单独显示、不写进档位。
   用户手动改过之后，`action.time` 写回用户的选择（`大约 N 分钟`）。
5. **记录页**：工具行只剩「加一张照片 / 记录时间 / 帮我整理」；关联入口独立一行可点，
   点击行为、候选列表、「不关联」全部不变。

## Data and interface changes

无。`action.time` 仍是人读字符串，只是取值来源从「AI 值 + 用户覆盖」收敛为「用户选择」；
`DURATION_OPTIONS` 是页内常量，不在数据契约内。

## Validation strategy

- `npm run typecheck`、`npm run build` 必过。
- `npm run verify`：更新第一步页时长断言（不再写死 10），新增
  ① 无 AI 配置下点 DO 直达 `.action-page` 且 `.input-page` 从未出现；
  ② 档位为 5 / 15 / 自定义三档且初始恰有一个 `.selected`；
  ③ 自定义输入生效并夹取。
- 记录页关联行：断言工具行不再包含「关联一个念头」文本、`.record-link` 独立存在。
- 真机（手指触摸滑动手感）仍不在本轮覆盖范围，沿用 `v2-device-feedback` 的待确认项。

## Rollout implications

随 GitHub Pages 既有自动部署；无数据迁移。老用户的 DO 上写着「大约 10 分钟」时，
进第一步页会被吸附到 15 分钟 —— 这是刻意的（否则两颗胶囊都不亮），用户不改也能直接三选。

## Policy conflicts and exceptions

无。本轮不动动效契约与数据契约；`#45` 卡片改版仍在 `v2-device-feedback` 里等讨论。

## Material alternatives

| 方案 | 结论 |
|---|---|
| #46 备选：没配 AI 时也进对话页，但跳过提问直接产出行动 | 否。多一次界面跳转只为立刻离开，不如不进 |
| #46 备选：在设置页显式提示"未接入 AI"再让用户决定 | 否。用户没表态，本轮不夹带；已在 plan 的 Out of scope 单列 |
| #48 备选：完全忽略 AI 时长，恒默认 5 分钟 | 保留为备选。当前选吸附：AI 说 10 分钟时落到 15，与行动正文里写的时长更接近，矛盾更小 |
| #48 备选：把 AI 值作为第四档显示（如「AI 建议 10」） | 否。用户明确「不要 ai 建议值」 |
| #48 备选：保留 `MIN / HR` 双单位 | 否。自定义 75 分钟会渲染成 `1.25 HR`，可读性反而更差 |
