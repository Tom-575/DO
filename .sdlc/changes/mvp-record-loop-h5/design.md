# Design: MVP:记录闭环 H5(今天 + 记录 + 回忆)

status: accepted
owner: tom57
source_intent: .sdlc/changes/mvp-record-loop-h5/plan.md
issue:
pr:
supersedes:
created_at: 2026-09-13
updated_at: 2026-09-13

> 补录说明(2026-09-13):设计方案在开发前经用户逐项确认(本文件 §决策),
> 本记录为事后归档,内容如实。

## 记录信息

| 项目 | 内容 |
|---|---|
| 变更编号 | mvp-record-loop-h5 |
| 阶段负责人 | tom57 |
| 来源 intent | plan.md(已接受) |
| 风险等级 | medium |
| 当前状态 | accepted(design gate 已过,补录) |
| 创建时间 | 2026-09-13 |
| 更新时间 | 2026-09-13 |

## 解决方案边界

**架构(用户 2026-09-13 定稿)**:纯前端单机应用,无后端/无数据库/无账号。

| 层 | 决策 |
|---|---|
| 语言/框架 | TypeScript + React 19 + Vite + Motion + Phosphor |
| 数据 | DO/记录/图片 → IndexedDB(idb-keyval,图片存原始 Blob);设置与 AI key → localStorage |
| 状态 | Context + useReducer,单一 store,action 粒度化 |
| AI | lib/ai.ts 统一 adapter → OpenAI 兼容 /chat/completions 直连;无 key 自动回落 mock;行为契约 docs/DO-PROMPT.md |
| 备份 | 导出/导入 JSON(Blob↔base64 往返),启动申请 navigator.storage.persist() |
| 部署 | GitHub Pages + Actions(vite base /DO/) |
| 页面切换 | 进入动效 + 即时替换(见 §实现要点) |

**数据契约**(docs/TODO.md 文末,构建期间唯一权威定义):

- `DO { id, thought, action{title,time,stop}, status: 待定|待记录|已记录, intent: 愿意去做|不想做了|暂不决定|null, createdAt, parkedAt? }`
- `MemoryRecord { id, text, refined?, images: (string|Blob)[], linkedDOId?, createdAt }`
- 状态流转:创建→待定;开始行动→待记录;保存关联记录→已记录;不存在「已完成」

**页面与交互**:今天(主 DO 推荐+备选+收起区/记录次入口)→ 输入页 → 行动页(意向三选/
换一个/改念头)→ 记录页(文字+图片+关联推荐+帮我整理+保存)→ 回忆页(倒序/图文/空状态)。
视觉与动效遵循 docs/design/DESIGN.md。

## 验证策略

- 每次提交前 `tsc --noEmit` + `vite build` 双闸(类型 + 打包)
- 阶段性浏览器走查(见 test.md):以「完整闭环 + 刷新持久化」为通过标准
- 真机验收(#11)作为 Deploy 阶段证据,由用户执行

## 实现要点(开发中确立)

1. **页面切换不用 AnimatePresence 退出动画**:其退出在嵌入式 webview 永不结束,
   卡死切页(浏览器走查发现,原始单文件版同样受影响)。改为「进入动效 + 即时替换」,
   已记入 DESIGN.md §5。
2. **背景值四态**:'none' / 内置渐变 'mist' 'night' / 图片 URL;默认背景须用
   `import.meta.env.BASE_URL` 前缀,否则 Pages 子路径下 404。
3. **storage 读回需保留 ai 字段**(写读链路对称),否则 AI 配置刷新即丢。

## 决策与取舍记录

| 决策 | 依据 |
|---|---|
| TS 而非 JS | 用户确认;类型锁死数据契约,保障多代理并行安全 |
| IndexedDB 而非 localStorage | 图片 Blob 直存,避开 5MB 上限 |
| 自定义 OpenAI 兼容直连 | 用户确认;mock 永远兜底,UI 不被 AI 可用性阻塞 |
| 分享卡片后置 | 用户确认;MVP 闭环止步于回忆回看 |
| 无账号/登录 | 用户取舍;触发条件见 plan.md Out of scope |
