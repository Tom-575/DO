# DO H5 开发 TODO

> 目标：把 `prototypes/first-loop` 从交互示意升级为完整可用的 H5 应用（记录闭环跑通、可部署、可自用验证）。
>
> 依据：`CONTEXT.md`（已确认决策）、`DESIGN.md`（as-built 基线 + §7 已知问题 + §8 设计任务）、`PRD.md` §7（MVP 必须有）。
>
> 多窗口使用方式：每个任务标注了涉及文件与依赖。**W0 未完成前不要开 W1/W2 窗口**（它们都在改同一批文件）。每个窗口开工时用 `ai-sdlc-plan` 为所属工作流 start 一个 change，完成后过 gate 再 advance。

## 依赖关系

```text
W0 工程基线（单窗口串行，一切的地基）
├─→ W1 记录闭环 ─┐
├─→ W2 DO 生命周期与首页 ─┤→ W4 部署与真实验证
└─→ W3 AI 接入（mock 随 W0，真实 AI 独立）─┘
```

---

## W0 · 工程基线（必须最先做，建议单窗口）

### T0.1 拆分单文件工程
- **做什么**：`app.jsx`（77 行单文件）拆为模块化结构；入口改为 `/src/main.jsx`；`styles.css` 暂保留单文件全局样式。
- **目标结构**：
  ```text
  src/
    main.jsx            # 入口
    App.jsx             # 手机框 + 页面切换
    store/store.jsx     # 全局状态（Context + reducer）
    store/persistence.js# localStorage 读写
    lib/ai.js           # AI adapter（先 mock 实现）
    lib/date.js         # 日期工具（修硬编码日期）
    pages/TodayPage.jsx / MemoriesPage.jsx / InputPage.jsx / ActionPage.jsx
    components/TabBar.jsx / NavBar.jsx / DOButton.jsx / ListRow.jsx / MemoryItem.jsx / AppearanceSheet.jsx
  ```
- **验收**：`npm run prototype` 行为与拆分前完全一致；无功能变化。
- **涉及**：重构 `app.jsx`、`index.html`。

### T0.2 数据模型 + store + 持久化
- **做什么**：定义数据结构并落地 central store；localStorage 持久化（带 schema 版本号，留迁移余地）。
- **数据契约**（后续所有窗口以这份为准，改动需在本文档同步）：
  ```text
  DO     { id, thought, action{title, time, stop}, status: 待定|待记录|已记录,
           intent: 愿意去做|不想做了|暂不决定|null, createdAt, parkedAt? }
  Record { id, text, refined?, images[], linkedDOId?, createdAt }
  AppState { dos[], records[], settings{theme, background} }
  ```
- **验收**：创建 DO / 切状态 / 存记录后刷新页面数据不丢；状态流转：开始行动→待记录，保存关联记录→已记录。
- **涉及**：新增 `store/`、`lib/`。

### T0.3 修复 4 个已知 bug（DESIGN.md §7）
1. 今天页日期改实时生成（`lib/date.js`）。
2. 「薄雾 / 夜色」背景：补真实背景处理或先移除选项（保留「纯净 + 本地上传」）。
3. 回忆条目「生成分享内容」死按钮：W1.4 完成前先隐藏。
4. 首页背景与回忆配图复用同一张图：换素材或回忆条目换图。
- **验收**：对照 DESIGN.md §7 逐条消除。

---

## W1 · 记录闭环（核心价值，依赖 W0）

### T1.1 记录创建
- **做什么**：全局记录入口（今天页次入口，不从 DO 也能进）；创建页支持文字 + 图片（本地上传，base64 存 localStorage）；「保存」为私人记录；关联 DO 为可选步骤（手动选 / 接受推荐 / 跳过，推荐可取消，不阻塞输入）。
- **交互**：参考小红书发布——先表达 + 加素材，后选关联。
- **验收**：不关联 DO 也能保存；关联后该 DO 自动转「已记录」，无需确认「是否完成」。
- **涉及**：新增 `pages/RecordPage.jsx`；改 `TodayPage`、`store`。

### T1.2 帮我整理
- **做什么**：保存的记录保留**原话 + AI 整理版**两份；「帮我整理」由用户主动触发（AI 不在输入过程中实时改写）；整理结果直接进入可编辑状态。
- **验收**：先接 `lib/ai.js` 的 mock（固定模板整理）；真实 AI 由 W3 替换，UI 不变。
- **涉及**：`RecordPage`、`lib/ai.js`。

### T1.3 回忆时间线接真实数据
- **做什么**：删除硬编码 memories；按 `createdAt` 倒序渲染真实记录；图文混排（纯文字 / 图+文两种形态都要有，见 DESIGN.md §4 记忆条目规范）；空状态设计。
- **验收**：W1.1 保存的记录立即可见于回忆页；刷新不丢。
- **涉及**：`MemoriesPage`、`MemoryItem`。

### T1.4 分享卡片
- **做什么**：从记录生成单张图文卡片（封面图 / 标题 / 正文摘要）；内容可编辑；生成图片供用户保存（canvas 渲染或 DOM 截图方案，倾向无新依赖的 canvas）；分享是独立动作，不强制。
- **验收**：分享内容不虚构未发生的事、保留用户语气；恢复「生成分享内容」按钮并打通。
- **涉及**：新增 `components/ShareCard.jsx`；改 `MemoriesPage`。

---

## W2 · DO 生命周期与首页（依赖 W0，可与 W1 并行）

### T2.1 首页信息架构
- **做什么**：主 DO 推荐 1 条 + 备选 1 条 + 收起区（候选上限 3，其余折叠）；多个新念头全部保存但不全部并列展示；待定超 24h 自动回收进历史清单；历史清单入口（回忆页或收起区，按 DESIGN.md §8.5 定稿）。
- **验收**：首页可见 DO 数量受控；被回收的 DO 可从历史清单看到。
- **涉及**：`TodayPage`、`store`（回收逻辑）。

### T2.2 行动意向三选
- **做什么**：看到最小行动后提供轻量选择：愿意去做 / 不想做了 / 暂时不决定；允许不选直接执行并回来记录；「不想做了」直接进历史。
- **验收**：意向存入 DO.intent；不选择不阻塞任何流程。
- **涉及**：`ActionPage`、`store`。

### T2.3 状态流转接线
- **做什么**：把三态状态机接进所有入口：创建→待定；开始行动→待记录；保存关联记录→已记录；「先放着」→保持待定（由 T2.1 的 24h 回收处理）。
- **验收**：任何一个状态变化都能在 UI 与 localStorage 中对应；无「已完成」概念出现。
- **涉及**：`store`、`ActionPage`、`TodayPage`。

---

## W3 · AI 接入（依赖 W0 的 adapter 接口，独立推进）

### T3.1 AI adapter 定义
- **做什么**：`lib/ai.js` 暴露统一接口：`generateAction(thought, context)` 与 `refineRecord(record)`；mock 实现内置（关键词 + 模板），保证无网络也能全流程跑通。
- **验收**：W1.2 / 行动页通过同一接口调用，切换实现零 UI 改动。
- **涉及**：`lib/ai.js`。

### T3.2 真实 AI（含架构决策）
- **做什么**：接真实模型，行为契约 = `docs/DO-PROMPT.md`。**先决策调用架构**：纯前端直连（用户填 key，存 localStorage）还是加一个极简本地/托管 proxy（key 不落前端）。原型阶段建议前者。
- **验收**：开放式输入能给出合理最小行动；多轮修正可用。
- **依赖决策**：API 选择（如 GLM / DeepSeek / OpenAI 兼容接口）。

### T3.3 理解与澄清
- **做什么**：先推断用户想体验什么并给暂定理解；只在不同解释明显改变行动时问**一个**简短问题；允许用户直接接受或纠正；支持对建议的「修正 / 换一个」（PRD §7 必须有项）。
- **验收**：模糊输入（"我想运动一下"）→ 合理行动；"不对，我说的是…" → 修正后重生成。
- **涉及**：`lib/ai.js`、`ActionPage`。

---

## W4 · 部署与真实验证（W1/W2 基本可用后，托管可提前练手）

### T4.1 构建与托管
- **做什么**：`vite build` 产出静态包；选托管（GitHub Pages / Vercel / Netlify，仓库已在 GitHub，Pages 零额外成本）；加 GitHub Actions 自动部署。
- **验收**：手机浏览器可访问固定 URL；每次 push 自动更新。

### T4.2 真机适配
- **做什么**：iOS Safari + 安卓 Chrome 验收：safe-area、软键盘遮挡与滚动、图片上传、localStorage 容量（base64 图片膨胀 ×1.37，必要时压缩）。
- **验收**：核心流程（输入→行动→记录→保存→回看→分享）真机全通。

### T4.3 自用验证准备
- **做什么**：按 PRD §12 准备验证记录方式（每次：原始想法 / 给出的行动 / 是否开始 / 实际做了什么 / 原话 / 整理版 / 是否愿分享）；PRD §8 指标的手工记录表。
- **验收**：可以开始 7–14 天连续自用。

---

## 明确不做（防止窗口发散）

账号与云同步、后端数据库、社交信息流与互动数据、抽签唤起、习惯 streak / 积分、多平台格式导出、自动排版剪辑封面、网页链接与视频解析（PRD 均列为后置或明确不做）。

## 窗口分配建议

| 窗口 | 任务序列 |
|---|---|
| A | W0 全部（串行做完）→ W2 |
| B | 等 W0 完成 → W1 |
| C | W3（T3.1 随 W0 后即可做，T3.2/3.3 与 W1/W2 并行） |
| D | T4.1 可提前练手部署当前版；T4.2/4.3 收尾 |

碰撞规则：W0 完成前不开 B 窗口；A、B 窗口分别只动各自 workstream 标注的文件；改数据契约（T0.2）必须同步回本文档并提交。
