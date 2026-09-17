# Design: UI V2 全套视觉与四屏闭环重做

status: accepted
owner: codebuddy-agent
source_intent: .sdlc/changes/ui-v2-redesign/plan.md
issue:
pr:
supersedes: 视觉部分取代 DESIGN.md §3/§4 的 ios 蓝本基线（产品语义与 §5 动效原则不变）
created_at: 2026-09-17
updated_at: 2026-09-17

## 记录信息

| 项目 | 内容 |
|---|---|
| 变更编号 | ui-v2-redesign |
| 阶段负责人 | tom57 |
| 来源类型 | feature |
| 来源引用 | `UI/2026-09-17-19-51-33/DO-UI/*.png` |
| 上游记录 | plan.md |
| 当前状态 | accepted |

## Chosen approach

**换皮 + 换信息架构，不换数据管线**：`store/`、`lib/ai`、`lib/storage`、`lib/backup`、
`lib/screen-origin`、`lib/use-expand-transition`、`lib/motion` 的既有契约保持；
视觉层（`styles.css` + 各页 `.css`）整体重写，页面组件按设计稿重排版式，新增两个纯推导工具模块。

分工：

| 层 | 处置 |
|---|---|
| `styles.css` | 重写为 V2 token 体系 + 共用件（胶囊按钮 / 卡片 / kicker / 深色胶囊导航） |
| `pages/*` | 六个屏按稿重排（新增 StartPage、TracesPage；Today/Action/Record 重写） |
| `components/*` | TabBar / NavBar / MemoryItem→TraceItem / RecordCard→ShareCard 重写；ImageViewer 换皮 |
| `lib/` | 新增 `duration.ts`（时长解析/格式化）、`traces.ts`（分类与统计推导）；其余不动 |
| 数据契约 | 只加两个**可选**字段：`MemoryRecord.outcome?`、`AppSettings.onboarded?` |

## Affected boundaries

- **信息架构**：Tab 从 `today | memories` 变为 `today | traces`；屏集合新增 `appearance` 仍为 push 屏，
  分享卡降为痕迹页内的本地全屏遮罩（不进 store，保持「不把动画/浮层阶段写进 store」的既有约定）。
- **数据契约**：`RecordOutcome` 与 `AppSettings.onboarded` 为可选字段，旧数据零迁移。
- **动效**：沿用既有原点/容器变换机制，只调整原点控件（DO 主按钮 → 黑卡内的蜜桃胶囊；头像 → 我的 tab；回忆条目 → 痕迹卡片）。
- **持久化**：`onboarded` 写 localStorage（与 theme/background 同处），不写 IndexedDB。

## Behavior contract

1. **出发页**：`settings.onboarded === false` 时整屏为出发页（storage 恒返回布尔值，缺省归一为 `true`，老用户不被拦）；点「开始」写 `onboarded: true` 并进入今天页。
   出发页不阻塞数据读取（store 照常 hydrate）。
2. **今天页**：黑卡内是**念头草稿**（本地 state + store.idea），三个示例 chip 填入示例念头；
   「帮我找到第一步」把念头交给对话规划页（保持 #15 的多轮澄清红线）。
3. **第一步页**：黑卡大字 = 从 `action.time` 解析出的分钟（解析失败回落 10）；三个时长胶囊改写 `action.time`；
   「现在开始」= 待记录·愿意去做；「先不做，改天再说」= 待定·暂不决定（刷新 parkedAt）；
   「不想做了」= 待定·不想做了（parkedAt 回拨 24h 以上，沉入历史）；「换一个建议」= 重新生成一次行动。
4. **记录页**：结果四选**可跳过**（不做必填，守住低压力原则）；「生成我的记录」等价原「保存」；
   原话永不被 AI 覆盖；帮我整理仍是用户主动触发；关联 DO 变更继续联动 DO 状态（reducer 内既有逻辑）。
5. **痕迹页**（2026-09-17 用户裁决：**去掉筛选**）：统计三项（真实尝试 = 记录数；做完了 / 中途停下 = 结果标签计数）；时间线卡片：有图 = 白卡（图 + 正文 + 日期·结果），无图 = 米色卡。
6. **分享卡**（2026-09-17 用户裁决：封面**不裁切**）：深色卡 + 封面按**原比例**完整绘制（高度随图伸缩）+ 文字排在封面下方（不压图）；「第 N 次尝试」徽章（无关联 DO 时不画）+ `{分钟} MIN` + 正文 + 签名；
   开关「保留我的原话，不做修饰」默认开（正文 = 原话，关 = 整理版 || 原话）；
   「分享」优先 `navigator.share({ files })`，不支持则等同「只保存图片」并给出说明。
7. **我的**：即原外观页，功能与草稿模型（✕ 丢弃 / ✓ 写回 / 数据分组立即生效）完全不变，仅换 V2 视觉。

## Data and interface changes

```ts
export type RecordOutcome = '做完了' | '做了一部分' | '中途停下来了' | '发现不太适合我';

export interface MemoryRecord {
  /* …既有字段不变… */
  outcome?: RecordOutcome;   // 新增,可选;旧记录缺省 = 不展示结果后缀
}

export interface AppSettings {
  /* …既有字段不变… */
  onboarded?: boolean;       // 新增,可选;缺省 = 未看过出发页
}
```

推导（不落库）：

- `parseMinutes(time)` / `formatDuration(minutes)` → `lib/duration.ts`
- （分类已按用户决定移除，不留推导实现）
- `traceStats(records)` → `{ total, done, stopped }`
- 尝试次数 = 关联到该 DO 的记录条数；最长时长 = 该 DO 的 `action.time` 解析值

## Validation strategy

- `npm run typecheck`、`npm run build` 必过。
- 浏览器（Chromium 430×932）逐屏走查 + 截图取证：出发 → 今天 → 第一步 → 记录 → 痕迹 → 分享卡 → 我的。
- 回归断言：三选语义落库/落状态、原话与整理版分离、旧记录无 outcome 不崩、导入导出可用、reduce-motion 下容器变换跳过。

## Rollout implications

纯前端静态资源，`vite build` 产物替换即可；无迁移、无回滚脚本；旧 localStorage/IndexedDB 数据向前兼容
（只读取已知字段；新增字段缺省即旧行为）。本 change 内不发布（Deploy 待人工决定）。

## Policy conflicts and exceptions

- **与 CONTEXT.md「行动页三选」**：V2 稿只画了两个出口。**用户 2026-09-17 裁决：保留三选**（第三档降为弱文字按钮），
  **且不复刻稿里的「换一个建议」**（导航右槽留空）——即完全不动 2026-09-13 的旧结论。
- **与 DESIGN §4「分享卡封面不裁切（#16）」**：曾按稿改成满幅裁切，**2026-09-17 用户裁决维持不裁切**，已改回原比例绘制（文字移到封面下方）。
- **与 DESIGN §3「单一强调色珊瑚橙」**：V2 用蜜桃 + 陶土双色，但职责仍是"强调与点缀"，未引入第二套语义色。

## Material alternatives

1. **只在旧 shell 上换色**：最小改动，但暗底大字卡、四槽导航、统计页这三件结构性变化无法落地 → 弃。
2. **痕迹分类**：先试过关键词推导，用户 2026-09-17 决定**整行筛选去掉**，推导与其实现一并删除。
3. **分享卡片继续用 DOM 预览 + canvas 导出**：预览与导出物可能不一致（既有事故面） → 弃，仍用 canvas 预览即导出物。
