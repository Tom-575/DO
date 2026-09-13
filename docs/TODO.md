# DO MVP TODO

**技术框架(已定,2026-09-13)**:TypeScript + React 19 + Vite + Motion + Phosphor;纯前端无后端;数据存 IndexedDB(idb-keyval,图片存原始 Blob),设置与 AI 配置存 localStorage;AI 走 lib/ai adapter → OpenAI 兼容接口直连(key 存本机);部署 GitHub Pages + Actions。

每个窗口开工时发这句 + 对应任务编号即可:
**「先读 AGENTS.md、docs/CONTEXT.md、docs/design/DESIGN.md,然后完成 docs/TODO.md 的任务 #N,完成后提交并推送」**

## 第一步(串行,一个窗口做完,期间不要开其他窗口)

- [x] **#1 工程重构** — 把 77 行单文件 app.jsx 拆成 src/ 模块结构并以 TypeScript 实现(pages / components / store / lib,数据契约类型定义在 store/types.ts),功能与视觉保持完全不变。
- [x] **#2 数据层** — 按文末数据契约实现全局 store;DO/记录/图片存 IndexedDB(idb-keyval,图片存原始 Blob),设置与 AI 配置存 localStorage;把现有硬编码数据换成真实数据流,刷新不丢。

## 第二步(可并行,一行一个窗口)

- [x] **#3 记录创建** — 新增全局记录入口和创建页(文字+图片),「保存」为私人记录,可选关联某个 DO,关联后该 DO 自动变已记录。
- [x] **#4 帮我整理**(前置 #3)— 记录保留原话,用户点「帮我整理」才生成整理版(先接 mock,契约见 docs/DO-PROMPT.md),整理版直接进入可编辑状态。
- [x] **#5 首页 DO 管理** — 主 DO 推荐 1 条 + 备选 1 条 + 收起区(候选上限 3);行动意向三选(愿意去做 / 不想做了 / 暂不决定,可不选直接执行);待定超 24h 自动收进历史清单。
- [x] **#7 回忆页真实化** — 删除硬编码记录,按时间倒序展示真实记录(图文两种形态),补空状态。
- [x] **#8 真实 AI** — 把关键词模拟换成真实 AI:OpenAI 兼容接口直连,baseURL / model / key 在设置页可配(key 存 localStorage),mock 保留为无 key 时的兜底;行为契约见 docs/DO-PROMPT.md,支持开放式输入、理解纠正、建议修正。
- [x] **#9 Bug 修复** — 修 DESIGN.md §7 四项:日期硬编码、薄雾/夜色背景失效、回忆页「生成分享内容」按钮直接移除(分享后置)、首页背景与回忆图复用。
- [x] **#10 部署** — vite build + 托管(推荐 GitHub Pages)+ push 自动部署,手机浏览器可访问。
- [x] **#12 数据备份** — 设置页加「导出 JSON / 导入 JSON」,把本机全部 DO 与记录打包备份与恢复(无云同步阶段的唯一保险);#2 启动时申请 navigator.storage.persist()。

## 收尾(全部完成后)

- [ ] **#11 真机验收** — iOS Safari + 安卓 Chrome 走通完整闭环:输入 → 行动 → 记录 → 保存 → 回看。

## 后置(本轮 MVP 不做)

- **分享卡片**:从记录生成单张图文卡片、可编辑、可保存为图片(原 #6,2026-09-13 决定后置)。MVP 闭环止步于:念头 → 最小行动 → 记录 → 保存 → 回忆回看。

## 数据契约(所有窗口共用;谁改谁同步本文件并提交)

```text
DO     { id, thought, action{title, time, stop},
         status: 待定|待记录|已记录, intent: 愿意去做|不想做了|暂不决定|null,
         createdAt, parkedAt }
Record { id, text, refined?, images[], linkedDOId?, createdAt }

状态流转:创建→待定;开始行动→待记录;保存关联记录→已记录。不存在「已完成」。
```
