# Build: 修复回忆条目导出按钮与时间文字重叠

status: accepted
source_intent: plan.md
source_design: design.md
issue:
pr:
revision: 本地构建(提交见 deploy)
owner: trae-agent
created_at: 2026-09-14
updated_at: 2026-09-14

## 记录信息

| 项目 | 内容 |
|---|---|
| 变更编号 | memory-export-overlap-fix |
| 阶段负责人 | trae-agent |
| 来源类型 | bug |
| 来源引用 | 用户截图 2026-09-14 |
| 上游记录 | plan.md / design.md |
| 代码版本 | 本地工作树 |
| PR | 无,直接 push main |
| 当前状态 | candidate |
| 创建时间 | 2026-09-14 |
| 更新时间 | 2026-09-14 |

## Implementation summary

- `styles.css` `.memory-time`:`padding: 0 5px 10px` → `padding: 0 42px 10px 5px`,右侧让出 30px 按钮宽 + 12px 间距。
- 顺带:`MemoryItem.tsx` 头注释把「封面原比例不裁切」纠为「首图缩略(4:3 裁切,原比例在查看器)」;DESIGN.md §2/§4、TODO.md #18 同步纠偏。

## Changed areas

- `prototypes/first-loop/src/styles.css`
- `prototypes/first-loop/src/components/MemoryItem.tsx`(仅注释)
- 文档:DESIGN.md、TODO.md

## Tests changed

无自动化测试;浏览器几何校验见 test.md。

## Material deviations

无。

## Local checks

| Check | Command | Result |
|---|---|---|
| 类型检查 | `npm run typecheck` | 通过 |
| 生产构建 | `npm run build` | 通过 |
| 几何校验 | 自动化浏览器 rect 对比 | span.right 700.2 < button.left 712.2,间距 12px |

## Known limitations

无。
