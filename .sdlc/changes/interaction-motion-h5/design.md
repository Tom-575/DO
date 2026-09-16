# Design: 手感与导航 —— 横滑切页 + 全站交互动效重做 + Tab 栏与外观页改形

status: accepted
owner: codebuddy-agent
source_intent: plan.md
issue:
pr:
supersedes:
created_at: 2026-09-16
updated_at: 2026-09-16

## 记录信息

| 项目 | 内容 |
|---|---|
| 变更编号 | interaction-motion-h5 |
| 阶段负责人 | tom57 |
| 来源类型 | feature（体验重做）+ refactor |
| 来源引用 | `docs/TODO.md` #23–#32 |
| 上游记录 | plan.md |
| 当前状态 | as-built 补录，阶段未推进 |
| 创建时间 | 2026-09-16 |
| 更新时间 | 2026-09-16 |

## Chosen approach

设计本体已写进 **`docs/design/DESIGN.md` §5.0–§5.3**；这里记录「为什么是这套」与边界。

**三条原则（本 change 唯一新增的契约，写在参数之前）**

1. **原点**：新界面必须**从被点的那个控件长出来**，且**形状守恒**。
   - 结果是一整屏 → **裁切铺满**：起点 = 控件形状的 `clip-path`，内容原地不动只被露出来。
   - 圆形控件（`+` 号、头像）声明 `shape: 'circle'`，起点终点**都**用 `circle()`；矩形才用 `inset(... round 控件圆角)`。
   - 反例（都在本次被修掉）：`circle` ↔ `inset` 浏览器无法插值会直接跳变；`inset(round 22px)` → `inset(round 0)` 看似合理，但两端之间圆角被拉平，**途中退化成圆角方块**，只有首尾是圆的。
2. **方向 + 跟手**：方向必须与触发手势一致（切页是横向手势 → 切页动效只能横向）；**位移必须由手势本身驱动**。
   - **禁止「到位之后再补一段动画」**：曾把「大标题横向回弹」实现成「非激活时偏移 46px、停稳后弹回」，用户读成「页面重新刷新了一次」。改为 `useSwipeLag`：**静止态恒为原位**，偏移只存在于运动瞬态，量值跟随滚动速度（慢拖几乎不甩、快甩才明显），欠阻尼弹簧在目标归零时过冲一次——那一下就是「弹回来」。
3. **物理**：用弹簧（质量 / 刚度 / 阻尼）而不是凑出来的贝塞尔曲线；过冲是阻尼比的结果，不是硬加的夸张效果。

**实现机制（四个新模块的职责划分）**

| 模块 | 职责 | 关键约束 |
|---|---|---|
| `lib/screen-origin.ts` | 点击处理器内**同步**测量来源控件的矩形与形状 | 存模块级变量而非 store（store 更新是异步批处理，测量必须在卸载前拿到）；take 一次即清空；量**布局盒**而非被 `whileTap` 变换过的盒 |
| `lib/use-expand-transition.ts` | 用原点做 `clip-path` 铺开 / 收回 | 内联 `clip-path` + CSS transition（不用自定义属性：多一层动画库包装容易丢，丢了就是整屏闪现）；收回**定时器驱动**，不走退场动画机制 |
| `lib/use-swipe-lag.ts` | 大标题惯性甩出 | 静止态恒为 0；静默 90ms 自动收回 |
| `lib/motion.ts` | 统一参数（弹簧 / 距离 / 错峰） | 整体调档的唯一入口 |

## Affected boundaries

| 边界 | 内容 |
|---|---|
| `src/lib/` | 新增 4 个模块（上表）——本次唯一的新概念集中地 |
| `src/App.tsx` | 新增横滑分页器、程序化滚动守卫、大标题甩出的接线；首页改为常驻 + `.push-layer` |
| `src/pages/` | 六个屏（首页/回忆/输入/行动/记录/外观）各自的进入方式与分区错峰 |
| `src/components/` | `TabBar`（指示点）、`PreviousRow`/`MemoryItem`/`DOButton`/`AppearanceButton`（原点 + 按下反馈）、`ImageViewer` |
| `src/styles.css` + 各页 css | Tab 栏一体、背景退后、滚动条统一隐藏、按下反馈 |
| `docs/design/DESIGN.md` | §5 重写为契约；§2/§4 的形态描述同步 |
| `docs/TODO.md` | 四期任务与豁免说明 |

## Behavior contract

- **切页落点**：滑动**越过中点立刻翻**（指示点因此在手指还未松开时就跟着走）；唯一要挡的是「点 Tab」触发的程序化平滑滚动——它一路上会掠过对侧页，跟着判定会把用户按回去，所以设 `PROGRAMMATIC_GUARD_MS`（600ms）守卫窗口，且 `onPointerDown` 时立刻作废。
- **未激活页** `inert` + `aria-hidden`，键盘与读屏不会落进看不见的一页。
- **首页常驻**在 push 屏下方：容器变换裁切出来的部分露出的必须是**真实的上一屏**，否则会露出空白底；有 push 屏时首页 `inert`。
- **浮层只做进入、不做退场**（Sheet / 查看器 / 卡片遮罩）：关闭即卸载；需要反向动效时按容器变换的收回处理（定时器）。
- **按下反馈的适用边界**：元素**同时被 motion 驱动**时必须用 `whileTap`（动画结束后残留的内联 `transform` 会盖住 CSS `:active { transform }`，此前列表行与回忆条目的按下缩放实际是失效的）；**纯 CSS 按钮**没有这个问题，用 `:active { transform }` 更简单。
- **reduce-motion**：过渡由 `* { transition: none !important }` 兜底，动画各自有 media 块；容器变换直接跳过。

## Data and interface changes

- **无数据契约变更**（`DO` / `Record` / IndexedDB / AI adapter 零改动）。
- 状态层：`Screen` 联合类型新增 `'appearance'`（原 `appearanceOpen` 布尔量收敛掉）；新增 `navDirection: 'forward' | 'back'`，用于给「没有来源控件可依附」的页面决定从哪一侧进入；`goHome` 不再强制把 tab 掰回「今天」。
- 新增四个 lib 模块的导出接口（见 build.md 的 Changed areas）。

## Validation strategy

- 机械检查：`npm run typecheck`、`npm run build`。
- 人工/浏览器：桌面 Chrome 手测横滑、六个容器变换、Tab 指示点跟随、外观页草稿模型、数据分组「立即生效」边界。
- **两轴 code review**（Standards / Spec 并行子代理，固定点 `7f83f75`，作者复核后剔除误报）——结果与修复记入 test.md。

## Rollout implications

纯前端静态资源，GitHub Pages + Actions；**无迁移、无后端**。回滚 = 回退提交（本 change 的候选版本是**未提交的工作树**，见 build.md 的 revision）。

## Policy conflicts and exceptions

1. **`DESIGN §5.1` 原文过宽**：把「按下缩放只能用 `whileTap`」写成通例，与 §5.3 及代码（11 处纯 CSS 按钮用 `:active`）矛盾。已改为有适用范围的规则——**这是本 change 自己引入又自己修掉的文档缺陷**。
2. **「夸张档」突破旧条款**：当前参数含带过冲弹簧（过冲 16% / 28%），与既有「禁止弹跳」冲突。§5.1 已记为**试验态、待定稿**：定稿时二选一——把「进入动效允许轻微过冲」写进契约，或把弹簧换回缓动曲线。**该决定待人工**。

## Material alternatives

| 方案 | 结论 |
|---|---|
| 手势库（如各类 swipe 组件）vs 原生 `scroll-snap` | 选原生：位移天然跟手，少一层状态机，两页可常驻 |
| macOS 式窗口展开（`translate + scaleX/Y`） | 试过并弃用，文件已删。一整屏的目标下内容会变形，不如裁切 |
| 外观页形态：底部 Sheet / 右上浮层 / 一整屏 | 前两者弃用。判定：**换入场动画救不了错的形态**——从头像弹出的东西不该是个底部抽屉 |
| 「大标题位移式回弹」 | 弃用（把偏移写进了静止态，与手势脱钩）。替代：惯性甩出 |
