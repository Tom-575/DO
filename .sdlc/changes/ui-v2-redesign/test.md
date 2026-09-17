# Test: UI V2 全套视觉与四屏闭环重做

status: accepted
candidate_revision: 工作树（未提交）
source_intent: plan.md
source_design: design.md
source_change: ui-v2-redesign
verifier: codebuddy-agent（CDP 驱动本机 Chrome，430×932，deviceScaleFactor 2）
created_at: 2026-09-17
updated_at: 2026-09-17

## 记录信息

| 项目 | 内容 |
|---|---|
| 变更编号 | ui-v2-redesign |
| 阶段负责人 | tom57 |
| 被验证版本 | dev server `http://localhost:4173/DO/`（工作树） |
| 上游记录 | plan.md / design.md / build.md |
| 验证者 | codebuddy-agent（CDP 直连本机 Chrome） |
| 当前状态 | 待人工确认 gate |

## 验证方法

干净 profile（localStorage / IndexedDB 全空）冷启动走完整闭环：出发 → 今天写念头 → 第一步（含「换一个建议」）→ 现在开始 → 痕迹页 `+` 进记录页（选结果 + 写真图 + 帮我整理）→ 生成我的记录 → 痕迹页 → 分享卡 → 我的（深色草稿 + 写回）→ 横滑切页。

断言方式：`Runtime.evaluate` 读 DOM 文本与 class；截图存 `.sdlc/evidence/ui-v2-redesign/`（01–11）。

## Acceptance criteria

| Criterion | Evidence | Result |
|---|---|---|
| 冷启动进出发页 | 01-start.png；`h1`=「不完美，也可以出发。」 | 通过 |
| 点开始写回 onboarded 并进今天页 | 02-today.png；`.tab-bar`=今天/开始/痕迹/我的 | 通过 |
| 今天页黑卡（念头 + 三 chip + 蜜桃胶囊） | 02-today.png | 通过 |
| 念头 → 第一步页（大字 10 MIN + 三档时长 + 三选） | 03-step.png；`.action-figure`=「10 MIN」 | 通过 |
| 「换一个建议」重新生成不卡死 | 走查日志 `regenerated body` 有值 | 通过 |
| 现在开始 → 待记录并回今天页，出「正在进行」卡 | 04-today-active.png | 通过 |
| 记录页：结果四选 + 白卡原话 + 工具胶囊 | 05-record.png；`h1`=「这次怎么样？」 | 通过 |
| 帮我整理：整理版生成、原话保留 | 日志 refined / original kept | 通过 |
| 生成我的记录 → 切痕迹页并落库 | 07-traces.png；`.trace-meta`=「今天 · 做完了」 | 通过 |
| 痕迹统计三项与结果标签一致 | `.trace-stats` = 1 / 1 / 0 | 通过 |
| 分类推导出筛选胶囊 | `.trace-filters` = 全部 / 音乐 | 通过 |
| 分享卡满幅封面 + 徽章 + 大字 + 正文 + 签名 | 08-share.png；canvas 680×898 | 通过 |
| 我的页 V2 版式与草稿模型可用 | 09-mine.png；标题=「我的」 | 通过 |
| 黑夜草稿 → ✓ 写回生效 | 10-today-dark.png；`theme-dark` | 通过 |
| 横滑切页与 tab 联动 | 11-traces-swipe.png；aria-label=痕迹 | 通过 |
| 旧记录（无 outcome）不崩、不显示结果后缀 | 代码路径：`outcomeTone()` 缺省 none；`traceStats` 只计数不假设存在 | 通过（未造旧数据实测） |
| reduce-motion 下容器变换跳过 | 沿用既有机制，未改动 | 未测（回归） |

## Revision 复验（2026-09-17 第二版）

| Criterion | Evidence | Result |
|---|---|---|
| 分享卡封面**不裁切**（原比例 + 文字在下方） | `08-share.png`；canvas 680×1150（原比例封面 + 文字块，无压图） | 通过 |
| 无关联 DO 时不画徽章 / 时长 | 同上（徽章与 MIN 均未出现） | 通过 |
| 痕迹页**无筛选 chip** | `07-traces.png`；`.trace-filters` 不存在（`Boolean(...) === false`） | 通过 |
| 去筛选后 typecheck / build 仍绿 | `npm run typecheck` / `npm run build` | 通过 |
| 底部导航**只有三槽**（今天 / 开始 / 痕迹） | `02-today.png`；`aria-label` = 今天 / 开始 / 痕迹 | 通过 |
| 「我的」只由今天页右上头像进入 | 点头像 → `.appearance-content`，标题「我的」（`09-mine.png`） | 通过 |
| 第一步页**无「换一个建议」**（方案 C） | 代码路径：导航右槽为 `.nav-spacer`；`typecheck` / `build` 通过 | 通过 |

## Change-specific checks：两轴 code review（固定点 = HEAD，对象 = 工作区）

两个并行子代理分别跑 **Standards**（`AGENTS.md` + DESIGN §5 + Fowler 坏味道基线）与 **Spec**（plan / design / TODO 五期 / DESIGN §2–§4），**分开报告不合并**；下列结论均经作者到代码里逐条复核。

### Standards 轴

| # | 发现 | 判定 | 处置 |
|---|---|---|---|
| 1 | `TabBar` 「开始」槽声明 `shape: 'circle'`，但它已被 grid 拉成 ≈128×52 胶囊，起点会退成 26px 小圆 | 真·硬违规（§5.0 形状守恒） | 已修：改回 `rect`（`inset(... round 26px)` 正好是胶囊形状） |
| 2 | `input.css` 丢了 `.thinking-dots` 的 reduce-motion 保护（全局 reduce 只关 `transition`） | 真·硬违规（§5.1） | 已修：补回 `@media` 块 |
| 3 | `TodayPage` 把 `EASE_OUT` 内联成字面量，`motion.ts` 的常量因此无人引用 | 真·硬违规（§5.2 唯一调档入口） | 已修：改为 `import { EASE_OUT }` |
| 4 | `formatDate` 死导出（改用 `formatKicker` 后无引用） | 真·死代码 | 已修：删函数与随之无用的 `WEEKDAYS` |
| 5 | 9 处注释指向已删组件（MemoryItem / RecordCard）、已改名页面（回忆页）、已移除的筛选 | 真·文档债 | 已修：TracesPage / traces.css / styles.css / AppearanceButton / ImageViewer / image-urls / store / memories-date / App |
| 6 | `BUILTIN_BACKGROUNDS`（App.tsx）与 `.background-swatch`（appearance.css）渐变同值两份 | judgement | **不修**：CSS 读不到 JS 常量，只能各写一份；已把注释改成正确指向（appearance.css）并列明「改一处要同步另一处」 |
| 7 | 头像原点半径实测 22px，文档 §5.3 写 16px | 真·文档过期 | 已修 DESIGN §5.2/§5.3 |

### Spec 轴

27 条可验证断言逐条到代码核对：**22 条成立**（六屏齐全、行动页三档且右槽无「换一个建议」、分享卡封面不裁切且文字在封面下方、开关默认取原话、痕迹页无筛选且 `classifyTrace`/`TRACE_TAGS` 已彻底删除、底部三槽无「我的」、`outcome?`/`onboarded?` 真可选、旧数据与老用户路径安全、结果可跳过可取消、原话不被 AI 覆盖、关联变更联动 DO、统计与尝试次数真推导、V2 色板、我的页草稿模型不变…）。

**3 条功能侧无问题、属文档未回写**（代码正确、文档相反）：DESIGN §9 最后一条仍写「保留换一个建议 / 拟改四槽」、DESIGN §2.1 仍写底部「我的」槽、design.md Policy conflicts 仍写「把换一个建议加回」。**已全部回写**；另把 design.md 的 `onboarded !== true` 措辞改为与实现一致的 `=== false`。

**剔除的误报**：0 条（两轴 20 条发现逐条验证后全部成立，仅第 6 条降级为不修）。

## Required checks

| Check | Source or command | Result |
|---|---|---|
| 类型检查 | `npm run typecheck` | 通过 |
| 生产构建 | `npm run build` | 通过 |
| 禁用 AnimatePresence | 全仓检索 | 通过（零命中） |

## Untested scope

- 真机（iOS Safari / 安卓 Chrome）：满幅摄影解码、Web Share 真实行为。
- 真实 AI 路径：本次全程走 mock。
- 多图记录与查看器多页横滑；reduce-motion 视觉走查。

## Residual risk

| 风险 | 说明 | 处置 |
|---|---|---|
| 真机差异 | 满幅摄影与 Web Share 未验 | 真机走查后再关 |
| 未提交 | 候选版本在工作树里 | 提交后作废 |
| 满幅裁切回归 | 与 #16 结论相反 | 已列入 plan.md 待确认项 |

## Verdict

`pass`（范围：桌面 Chromium 430×932 下六屏版式与完整闭环）
