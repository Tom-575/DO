# Plan: 手感与导航 —— 横滑切页 + 全站交互动效重做 + Tab 栏与外观页改形

status: accepted
owner: codebuddy-agent
source: 用户反馈 2026-09-16（当日十轮对话）
issue:
pr:
risk_level: low
created_at: 2026-09-16
updated_at: 2026-09-16

## 记录信息

| 项目 | 内容 |
|---|---|
| 变更编号 | interaction-motion-h5 |
| 阶段负责人 | tom57 |
| 来源类型 | feature（体验重做）+ refactor |
| 来源引用 | 用户对话 2026-09-16；`docs/TODO.md` #23–#32 |
| 风险等级 | low（纯前端原型；无数据契约变更、无迁移） |
| 当前状态 | active |
| 创建时间 | 2026-09-16 |
| 更新时间 | 2026-09-16 |

> **as-built 补录（2026-09-16）**：本 change 的工件在实现与多轮用户走查**之后**才补建。此前 #23–#32 以「豁免」方式直接执行（`docs/TODO.md` #23 的流程说明），而该豁免按 `TODO #20` 自己的判据是无效的——它的防复发去向指向 #21/#22 两个尚未落地的条目。**本次补录即是在补上那个去向**，并由新装的运行时门禁（`.codebuddy/rules/sdlc-gate/RULE.mdc`）防止下次再走豁免。

## Problem

一到三期的闭环功能已跑通，但**手感从未被设计过**：

1. 今天页与回忆页之间只能点 Tab，没有手势路径；
2. 交互几乎全是瞬时跳变——按下无反馈、内容直接蹦出、生成完成是突变、浮层瞬间出现；第一轮修法（统一加大位移幅度）被用户判定方向错了：**「不是幅度问题，是交互动画本身」**；
3. 用户按物理常识连出四问，每一条都指向一个具体错误：
   - 左右切页之后为什么是**上下**回弹？（方向错）
   - 点 `+` 号为什么不是**从 `+` 号铺满整屏**？（没有原点）
   - 点 `user` 为什么不是从 `user` 那里长出，而要从屏幕底部升起来？（形态错）
   - 底部那条线为什么把屏幕切成两块？（层次表达错）

## Desired outcome

- 今天 ↔ 回忆可左右滑动切换，**位移由手指驱动**，与 Tab 双向同步；
- 每个交互**按它做的事**设计动效，而不是套同一组参数：新界面从被点控件的位置与形状长出、返回按相反曲线收回、切页一律横向、按下都有回应；
- 底部 Tab 栏与页面视觉一体（无分隔线、无独立底色），但按钮、`aria-current` 与热区照旧。

## Scope

### In scope（`docs/TODO.md` #23–#32）

- 横滑分页器（原生 `scroll-snap`）、Tab 滑动指示点、切页落点判定与守卫；
- 容器变换（六处）：`+`→记录页、DO 按钮→输入页、列表行→行动页、回忆条目→编辑页、缩略图→查看器、头像→外观页；
- 新增 `lib/motion.ts`（统一参数）、`lib/screen-origin.ts`（原点测量）、`lib/use-expand-transition.ts`（容器变换）、`lib/use-swipe-lag.ts`（大标题惯性甩出）；
- push 屏进入方向（`navDirection`）、首页常驻在 push 屏下方 + 背景退后（`.main-page.receded` 高斯模糊）；
- 外观页形态演进：底部 Sheet → 右上浮层 → **一整屏 push 屏 + 草稿模型**（✓ 写回 / ✕ 丢弃）；
- Tab 栏 76→60px、去分隔线与底色、选中态三重表达；导航栏与各类按钮的按下反馈；滚动条统一隐藏。

### Out of scope

- 数据契约、IndexedDB 结构、AI adapter（**零改动**）；
- 视觉系统本身（配色 / 字号 / 间距 tokens）；
- 真机滑动与容器变换的最终验收（本 change 只到「代码 + 桌面浏览器可验证」为止，见 test.md 的 Untested scope）。

## Constraints

- **页面切换不得依赖退出动画机制**（`AnimatePresence` 的退出依赖在部分嵌入式 webview 永不结束，会卡死切页，事故 `531b570`）；一律「进入有动效、切换即替换」，浮层收回用**定时器驱动**。
- 保持 `npm run typecheck` 与 `npm run build` 通过；不新增依赖。
- 全局响应 `prefers-reduced-motion`。
- 形状必须守恒（圆形控件全程是圆）。

## Success criteria

- [x] 左右滑动可在今天/回忆间切换；未激活页 `inert`；两页各自保留纵向滚动位置（桌面浏览器手测）
- [x] 六个入口都有容器变换，圆形来源（`+` 号、头像）全程保持 `circle()`（代码核对 `shape: 'circle'`）
- [x] DESIGN §5.3 动效清单逐条与代码核对一致（两轴 code review 的 Spec 轴核对）
- [x] Tab 栏与页面同层、无分隔线；`aria-current` 保留
- [x] `npm run typecheck` / `npm run build` 通过
- [ ] 真机（iOS Safari / 安卓 Chrome）滑动与容器变换走查
- [ ] 提交与流水线（commit / push / Actions build）—— **未执行**

## Open decisions

- [x] 切页位移用原生 `scroll-snap`，不引入手势库（少一层状态机，位移天然跟手）
- [x] 外观页最终形态 = 一整屏 + 草稿模型（推翻「右上浮层 + 即时生效」）
- [x] 数据分组（导出/恢复）留在草稿之外，用「立即生效」tag 在组标签上标注边界
- [ ] 「夸张档」参数是否定稿为契约（当前含带过冲弹簧，与旧条款「禁止弹跳」冲突，见 design.md 的 Policy conflicts）
