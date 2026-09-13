# Plan: MVP:记录闭环 H5(今天 + 记录 + 回忆)

status: accepted
owner: tom57
source: docs/TODO.md
issue:
pr:
risk_level: medium
created_at: 2026-09-13
updated_at: 2026-09-13

> 补录说明(2026-09-13):本 change 于开发完成后回填。开发执行发生在 2026-09-13 当天,
> 用户逐次确认(定稿技术框架、选定 TS + 自定义 OpenAI 兼容、分享后置、"按方案1开始")
> 构成了本记录所引用的真实决策点;时间线为补写,内容如实。

## 记录信息

| 项目 | 内容 |
|---|---|
| 变更编号 | mvp-record-loop-h5 |
| 阶段负责人 | tom57 |
| 来源类型 | feature |
| 来源引用 | docs/TODO.md(#1–#12)、docs/design/DESIGN.md §8 |
| 风险等级 | medium |
| 当前状态 | accepted(plan gate 已过,补录) |
| 创建时间 | 2026-09-13 |
| 更新时间 | 2026-09-13 |

## Problem

原型 `prototypes/first-loop` 只有闭环前半段(念头 → 最小行动),且为内存态单文件示意:
行动之后回来记录、保存、回看这后半段(约一半的 CONTEXT.md 已确认决策)没有实现,
AI 是关键词模拟,刷新即丢——无法支撑 PRD §12 要求的 7–14 天自用验证。

## Desired outcome

把原型升级为完整可用的 H5 应用:今天页(念头/行动/意向)→ 记录(创建/整理/保存)→
回忆页(真实数据回看),数据本机持久化,AI 可接真实服务,可部署到手机访问,
支撑随后的自用验证并产出 PRD §8 指标。

## Scope

### In scope

- #1 工程重构:单文件拆分为 TypeScript 模块结构
- #2 数据层:store + IndexedDB(idb-keyval)/ localStorage 分工,持久化
- #3+#4 记录创建页(文字/图片/关联 DO)+ 帮我整理(原话+整理版)
- #5 首页 DO 管理(主推荐/备选/收起区上限 3/意向三选/待定 24h 回收)
- #7 回忆页真实化(倒序、图文、空状态)
- #8 真实 AI(OpenAI 兼容直连 adapter,mock 兜底;换一个/改念头)
- #9 已知 bug 修复(日期/背景/死按钮/图片复用)
- #10 GitHub Pages 自动部署;#12 导出/导入 JSON 备份

### Out of scope

- 分享卡片(用户 2026-09-13 决定后置,见 git 1aee386)
- **账号/登录/用户管理**(用户主动取舍:纯前端无后端架构下数据只存本机,
  登录无承载点;云同步与多用户列入 PRD 验证通过后的阶段。触发条件:
  需要跨设备同步、公开多用户、或数据需要服务端保管时,以新 change 立项)
- 后端服务、数据库、社交能力、抽签、streak/打卡

## Constraints

- 技术框架已定稿(2026-09-13,用户确认):TypeScript + React 19 + Vite + Motion +
  Phosphor,纯前端;AI 走 adapter → 自定义 OpenAI 兼容接口直连
- CONTEXT.md 已确认决策为不可违背边界;视觉遵循 docs/design/DESIGN.md
- 多窗口并行开发:文件所有权互斥,数据契约改动须同步 docs/TODO.md

## Success criteria

- [x] 浏览器走查通过完整闭环:念头 → 行动 → 意向 → 记录 → 整理 → 保存 → 回看(2026-09-13 实测)
- [x] 刷新后数据不丢(IndexedDB)
- [ ] 真机(iOS Safari / 安卓 Chrome)走通闭环 —— 对应 #11,待用户执行
- [ ] 7–14 天自用验证启动(PRD §12)

## Open decisions

- [x] 路线选择:A 先自用验证 / B 直接产品化 → 用户选 A(先补齐闭环再验证)
- [x] 语言:TypeScript(用户确认)
- [x] AI 接入:自定义 OpenAI 兼容接口直连(用户确认;后续可加 Cloudflare Worker 藏 key,adapter 不变)
- [x] 分享卡片:后置(用户确认)
