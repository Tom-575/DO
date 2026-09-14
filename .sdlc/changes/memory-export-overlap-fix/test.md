# Test: 修复回忆条目导出按钮与时间文字重叠

status: accepted
candidate_revision: 本地构建 2026-09-14(dev server 手测)
source_intent: plan.md
source_design: design.md
source_change: memory-export-overlap-fix
issue:
pr:
verifier: trae-agent(自动化浏览器)
created_at: 2026-09-14
updated_at: 2026-09-14

## 记录信息

| 项目 | 内容 |
|---|---|
| 变更编号 | memory-export-overlap-fix |
| 阶段负责人 | trae-agent |
| 被验证版本 | dev server @ http://localhost:4173/DO/ |
| 上游记录 | plan.md / design.md / build.md |
| 验证者 | trae-agent |
| 当前状态 | accepted |
| 创建时间 | 2026-09-14 |
| 更新时间 | 2026-09-14 |

## Acceptance criteria

| Criterion | Evidence | Result |
|---|---|---|
| 钟点文字完整可见,不被按钮遮挡 | 全页截图(今天 20:46 / 19:46 均完整) | 通过 |
| 几何无重叠:span.right ≤ button.left | span.right=700.20 < button.left=712.20,间距 12px | 通过 |
| 控制台无本次相关报错 | browser_console_messages | 通过 |
| typecheck / build | npm run typecheck;npm run build | 通过 |

## Known issues

无。
