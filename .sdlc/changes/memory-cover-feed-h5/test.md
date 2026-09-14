# Test: 回忆列表只展示首图+张数角标,全部图片在查看器内翻看

status: accepted
candidate_revision: 本地构建 2026-09-14(dev server 手测)
source_intent: plan.md
source_design: docs/design/DESIGN.md
source_change: memory-cover-feed-h5
issue:
pr:
verifier: trae-agent(自动化浏览器)
created_at: 2026-09-14
updated_at: 2026-09-14

## 记录信息

| 项目 | 内容 |
|---|---|
| 变更编号 | memory-cover-feed-h5 |
| 阶段负责人 | trae-agent |
| 被验证版本 | dev server @ http://localhost:4173/DO/ |
| 上游记录 | plan.md / design.md / build.md |
| 验证者 | trae-agent |
| 当前状态 | accepted |
| 创建时间 | 2026-09-14 |
| 更新时间 | 2026-09-14 |

## 验证方法

注入 test-a(3 图:横 900×600 / 竖 600×900 / 方 700×700)与 test-b(纯文字),走列表渲染与查看器全流程。

## Acceptance criteria

| Criterion | Evidence | Result |
|---|---|---|
| test-a 列表只渲染 1 个 img(首图),角标文本 "3" | browser_evaluate 统计 + step1-memory-list.png | 通过 |
| 纯文字 test-b 无图无角标 | step1-memory-list.png | 通过 |
| 点封面 → 查看器 "1 / 3",←→ 依次 "2 / 3" "3 / 3",三图完整显示 | step2-page3.png | 通过 |
| 点文字区 → 直接进编辑页,无查看器 | 交互快照 | 通过 |
| 控制台无本次相关报错 | browser_console_messages | 通过 |
| typecheck / build | npm run typecheck;npm run build | 通过 |

## Known issues

- 真机滑动手感同 #17,待用户统一走查。
