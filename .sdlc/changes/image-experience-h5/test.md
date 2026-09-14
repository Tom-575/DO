# Test: 三期图片体验:卡片封面原比例显示 + 回忆页全屏看图(小红书式滑动)

status: accepted
candidate_revision: 本地构建 vite build 2026-09-14(dev server 手测)
source_intent: plan.md
source_design: docs/design/DESIGN.md
source_change: image-experience-h5
issue:
pr:
verifier: trae-agent(自动化浏览器,Playwright 隔离 profile)
created_at: 2026-09-14
updated_at: 2026-09-14

## 记录信息

| 项目 | 内容 |
|---|---|
| 变更编号 | image-experience-h5 |
| 阶段负责人 | trae-agent |
| 被验证版本 | dev server @ http://localhost:4173/DO/(与本次构建同源码) |
| 上游记录 | plan.md / design.md / build.md |
| 验证者 | trae-agent |
| 当前状态 | accepted |
| 创建时间 | 2026-09-14 |
| 更新时间 | 2026-09-14 |

## 验证方法

自动化浏览器注入两条测试记录(test-a:红渐变横图 900×600 + 蓝渐变竖图 600×900;test-b:纯文字)至 IndexedDB(keyval-store/keyval 的 do.records),刷新后走完整交互。

## Acceptance criteria

| Criterion | Evidence | Result |
|---|---|---|
| 点 test-a 图片 → 黑底全屏查看器,页码 1/2,X+铅笔按钮 | step2-image-viewer.png | 通过 |
| ArrowRight → 页码 2/2,竖图完整显示不裁切 | step3-page2.png | 通过 |
| X 关闭查看器;铅笔 → 关闭查看器并进入编辑页,可返回 | 交互快照 | 通过 |
| 点纯文字记录(test-b)→ 直接进编辑页,不出现查看器 | 交互快照 | 通过 |
| 导出卡片:封面横图原比例(canvas 680×712 @2x,非方形) | card-preview-test-a.png | 通过 |
| 控制台无本次功能相关报错(仅注入脚本历史遗留) | browser_console_messages | 通过 |
| typecheck / build | npm run typecheck;npm run build | 通过 |

## Known issues

- 真机(iOS Safari / 安卓 Chrome)触屏滑动手感未验——本机为 Windows,待用户真机走查(plan 遗留项)。
